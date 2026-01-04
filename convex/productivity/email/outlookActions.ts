// Outlook user actions: trash, archive, delete, mark read/unread
import { v } from 'convex/values';
import { mutation, query, action, ActionCtx } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

async function ensureFreshToken(
  ctx: ActionCtx,
  userId: Id<'admin_users'>,
  tokens: { accessToken: string; refreshToken: string; expiresAt?: number }
): Promise<string | null> {
  const now = Date.now();
  if (!tokens.expiresAt || tokens.expiresAt >= now + 5 * 60 * 1000) {
    return tokens.accessToken; // Token still valid
  }

  try {
    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        refresh_token: tokens.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
    await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
      userId,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || tokens.refreshToken,
      expiresAt: now + data.expires_in * 1000,
      scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
    });

    return data.access_token;
  } catch {
    return null;
  }
}

export const getMessageById = query({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    return {
      _id: message._id,
      externalMessageId: message.externalMessageId,
      externalThreadId: message.externalThreadId,
      subject: message.subject,
      canonicalFolder: message.canonicalFolder,
    };
  },
});

export const deleteOutlookMessage = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const message = await ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
      userId: args.userId,
      messageId: args.messageId,
    });

    if (!message) return { success: false, error: 'Message not found' };

    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

    const now = Date.now();
    if (tokens.expiresAt && tokens.expiresAt < now + 5 * 60 * 1000) {
      try {
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID || '',
            client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
            refresh_token: tokens.refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          }),
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json() as { access_token: string; refresh_token?: string; expires_in: number };
          await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
            userId: args.userId,
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || tokens.refreshToken,
            expiresAt: now + refreshData.expires_in * 1000,
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          });
          tokens = { ...tokens, accessToken: refreshData.access_token };
        }
      } catch { /* continue with existing token */ }
    }

    // Retry helper for 429 rate limiting
    const moveWithRetry = async (attempt = 1): Promise<Response> => {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}/move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ destinationId: 'deleteditems' }),
        }
      );

      // 429 = rate limited - retry with exponential backoff
      if (response.status === 429 && attempt < 4) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
        console.log(`⏳ Delete rate limited (429), retry ${attempt}/3 in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        return moveWithRetry(attempt + 1);
      }

      return response;
    };

    try {
      const response = await moveWithRetry();

      // 404 = already deleted from Outlook - still clean up our DB
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Failed to move message to trash:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      // Capture the new message ID from Outlook's response
      // When Outlook moves a message, it assigns a NEW ID
      let newExternalMessageId: string | undefined;
      let newProviderFolderId: string | undefined;

      if (response.ok) {
        try {
          const movedMessage = await response.json() as { id: string; parentFolderId: string };
          newExternalMessageId = movedMessage.id;
          newProviderFolderId = movedMessage.parentFolderId;
          console.log(`Outlook moved message: old=${message.externalMessageId.slice(-8)}, new=${newExternalMessageId.slice(-8)}`);
        } catch {
          console.log('Could not parse move response, proceeding without new ID');
        }
      } else if (response.status === 404) {
        console.log(`Message ${message.externalMessageId} already deleted from Outlook, cleaning up DB`);
      }

      await ctx.runMutation(api.productivity.email.outlookStore.moveMessageToTrash, {
        userId: args.userId,
        messageId: args.messageId,
        newExternalMessageId,
        newProviderFolderId,
      });

      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, error: String(error) };
    }
  },
});

export const moveMessageToArchive = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    const archiveFolder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', message.accountId))
      .filter((q) => q.eq(q.field('canonicalFolder'), 'archive'))
      .first();

    await ctx.db.patch(args.messageId, {
      canonicalFolder: 'archive',
      providerFolderId: archiveFolder?.externalFolderId ?? message.providerFolderId,
    });

    return { success: true };
  },
});

export const archiveOutlookMessage = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const message = await ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
      userId: args.userId,
      messageId: args.messageId,
    });

    if (!message) return { success: false, error: 'Message not found' };

    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

    const now = Date.now();
    if (tokens.expiresAt && tokens.expiresAt < now + 5 * 60 * 1000) {
      try {
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID || '',
            client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
            refresh_token: tokens.refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          }),
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json() as { access_token: string; refresh_token?: string; expires_in: number };
          await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
            userId: args.userId,
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || tokens.refreshToken,
            expiresAt: now + refreshData.expires_in * 1000,
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          });
          tokens = { ...tokens, accessToken: refreshData.access_token };
        }
      } catch { /* continue with existing token */ }
    }

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}/move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ destinationId: 'archive' }),
        }
      );

      // 404 = already deleted from Outlook - still clean up our DB
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Failed to archive message:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      if (response.status === 404) {
        console.log(`Message ${message.externalMessageId} already deleted from Outlook, cleaning up DB`);
      }

      await ctx.runMutation(api.productivity.email.outlookActions.moveMessageToArchive, {
        userId: args.userId,
        messageId: args.messageId,
      });

      return { success: true };
    } catch (error) {
      console.error('Archive message error:', error);
      return { success: false, error: String(error) };
    }
  },
});

export const updateMessageReadStatus = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    await ctx.db.patch(args.messageId, {
      isRead: args.isRead,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const batchUpdateMessageReadStatus = mutation({
  args: {
    userId: v.id('admin_users'),
    messageIds: v.array(v.id('productivity_email_Index')),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const now = Date.now();
    let updated = 0;

    await Promise.all(
      args.messageIds.map(async (messageId) => {
        const message = await ctx.db.get(messageId);
        if (message) {
          await ctx.db.patch(messageId, {
            isRead: args.isRead,
            updatedAt: now,
          });
          updated++;
        }
      })
    );

    return { success: true, updated };
  },
});

export const markOutlookMessageReadStatus = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
    isRead: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const message = await ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
      userId: args.userId,
      messageId: args.messageId,
    });

    if (!message) return { success: false, error: 'Message not found' };

    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

    const now = Date.now();
    if (tokens.expiresAt && tokens.expiresAt < now + 5 * 60 * 1000) {
      try {
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID || '',
            client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
            refresh_token: tokens.refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          }),
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json() as { access_token: string; refresh_token?: string; expires_in: number };
          await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
            userId: args.userId,
            accessToken: refreshData.access_token,
            refreshToken: refreshData.refresh_token || tokens.refreshToken,
            expiresAt: now + refreshData.expires_in * 1000,
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          });
          tokens = { ...tokens, accessToken: refreshData.access_token };
        }
      } catch { /* continue with existing token */ }
    }

    try {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isRead: args.isRead }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update message read status:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      return { success: true };
    } catch (error) {
      console.error('Mark read/unread error:', error);
      return { success: false, error: String(error) };
    }
  },
});

export const batchMarkOutlookReadStatus = action({
  args: {
    userId: v.id('admin_users'),
    messageIds: v.array(v.id('productivity_email_Index')),
    isRead: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; processed: number; failed: number; skipped: number; hadRateLimiting: boolean; errors?: string[] }> => {
    const messageCount = args.messageIds.length;

    const BATCH_SIZE = messageCount > 1000 ? 5 : messageCount > 200 ? 10 : 20;
    const BATCH_DELAY_MS = messageCount > 1000 ? 1000 : messageCount > 200 ? 500 : 300;

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [500, 1000, 2000]; // Exponential backoff

    let hadRateLimiting = false;

    const messages = await Promise.all(
      args.messageIds.map((id) =>
        ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
          userId: args.userId,
          messageId: id,
        })
      )
    );

    const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null);
    const skippedFromDb = args.messageIds.length - validMessages.length;

    if (validMessages.length === 0) {
      return { success: false, processed: 0, failed: 0, skipped: skippedFromDb, hadRateLimiting: false, errors: ['No valid messages found in DB'] };
    }

    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) {
      return { success: false, processed: 0, failed: validMessages.length, skipped: skippedFromDb, hadRateLimiting: false, errors: ['No Outlook access token'] };
    }

    const accessToken = await ensureFreshToken(ctx, args.userId, tokens);
    if (!accessToken) {
      return { success: false, processed: 0, failed: validMessages.length, skipped: skippedFromDb, hadRateLimiting: false, errors: ['Token refresh failed'] };
    }

    console.log(`📦 Batch sync: ${validMessages.length} messages (batch=${BATCH_SIZE}, delay=${BATCH_DELAY_MS}ms, ${skippedFromDb} not in DB)`);

    let totalProcessed = 0;
    let totalFailed = 0;
    let totalSkipped = skippedFromDb;
    const errors: string[] = [];

    const isRetryable = (status: number): boolean => status === 429 || status >= 500;

    type BatchResult = { processed: number; failed: number; skipped: number; retryItems: typeof validMessages; sawRateLimit: boolean };

    const processBatch = async (
      batch: typeof validMessages,
      attempt: number
    ): Promise<BatchResult> => {
      let sawRateLimit = false;
      const batchRequests = batch.map((msg, idx) => ({
        id: String(idx),
        method: 'PATCH',
        url: `/me/messages/${msg.externalMessageId}`,
        headers: { 'Content-Type': 'application/json' },
        body: { isRead: args.isRead },
      }));

      try {
        const response = await fetch('https://graph.microsoft.com/v1.0/$batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: batchRequests }),
        });

        // HTTP-level failure
        if (!response.ok) {
          console.error(`❌ Batch HTTP ${response.status}`);
          if (response.status === 429) sawRateLimit = true;
          if (isRetryable(response.status) && attempt < MAX_RETRIES) {
            return { processed: 0, failed: 0, skipped: 0, retryItems: batch, sawRateLimit };
          }
          return { processed: 0, failed: batch.length, skipped: 0, retryItems: [], sawRateLimit };
        }

        const data = await response.json() as {
          responses: Array<{ id: string; status: number; body?: { error?: { code?: string; message?: string } } }>
        };

        let processed = 0;
        let failed = 0;
        let skipped = 0;
        const retryItems: typeof validMessages = [];

        for (const res of data.responses) {
          const msgIndex = parseInt(res.id, 10);
          const msg = batch[msgIndex];

          if (res.status >= 200 && res.status < 300) {
            processed++;
          } else if (res.status === 404) {
            // Message deleted on server - skip permanently
            console.warn(`⚠️ ${msg?.externalMessageId?.slice(-8)} 404 - deleted on server`);
            skipped++;
          } else if (isRetryable(res.status) && attempt < MAX_RETRIES) {
            // Transient error - retry
            if (res.status === 429) sawRateLimit = true;
            if (msg) retryItems.push(msg);
          } else {
            // Permanent failure
            if (res.status === 429) sawRateLimit = true;
            const code = res.body?.error?.code || 'Unknown';
            console.error(`❌ ${msg?.externalMessageId?.slice(-8)} (${res.status}): ${code}`);
            errors.push(`${res.status}: ${code}`);
            failed++;
          }
        }

        return { processed, failed, skipped, retryItems, sawRateLimit };
      } catch (error) {
        console.error(`❌ Network error:`, error);
        if (attempt < MAX_RETRIES) {
          return { processed: 0, failed: 0, skipped: 0, retryItems: batch, sawRateLimit };
        }
        return { processed: 0, failed: batch.length, skipped: 0, retryItems: [], sawRateLimit };
      }
    };

    const batches: typeof validMessages[] = [];
    for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
      batches.push(validMessages.slice(i, i + BATCH_SIZE));
    }

    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      let currentBatch = batches[batchIdx];

      for (let attempt = 0; attempt <= MAX_RETRIES && currentBatch.length > 0; attempt++) {
        if (attempt > 0) {
          const delay = RETRY_DELAYS[attempt - 1] || 2000;
          console.log(`🔄 Retry ${attempt}/${MAX_RETRIES}: ${currentBatch.length} msgs after ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }

        const result = await processBatch(currentBatch, attempt);
        totalProcessed += result.processed;
        totalFailed += result.failed;
        totalSkipped += result.skipped;
        if (result.sawRateLimit) hadRateLimiting = true;
        currentBatch = result.retryItems;
      }

      if (currentBatch.length > 0) {
        console.error(`❌ ${currentBatch.length} msgs failed after ${MAX_RETRIES} retries`);
        totalFailed += currentBatch.length;
      }

      if (batchIdx < batches.length - 1) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    const icon = totalFailed === 0 ? '✅' : '⚠️';
    console.log(`${icon} Batch sync: ${totalProcessed} ok, ${totalFailed} failed, ${totalSkipped} skipped${hadRateLimiting ? ' (rate limited)' : ''}`);

    return {
      success: totalFailed === 0,
      processed: totalProcessed,
      failed: totalFailed,
      skipped: totalSkipped,
      hadRateLimiting,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    };
  },
});

