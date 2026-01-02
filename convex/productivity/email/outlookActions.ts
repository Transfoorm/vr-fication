/**
 * Outlook User Actions
 *
 * Message operations initiated by users: trash, archive, delete.
 * Each action: Graph API call → local state update.
 */

import { v } from 'convex/values';
import { mutation, query, action, ActionCtx } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

// Shared helper for token refresh (DRY - used by all actions)
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

// ═══════════════════════════════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// TRASH
// ═══════════════════════════════════════════════════════════════════════════

export const moveMessageToTrash = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    const trashFolder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', message.accountId))
      .filter((q) => q.eq(q.field('canonicalFolder'), 'trash'))
      .first();

    await ctx.db.patch(args.messageId, {
      canonicalFolder: 'trash',
      providerFolderId: trashFolder?.externalFolderId ?? message.providerFolderId,
    });

    return { success: true };
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

    // Check if token needs refresh
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
          body: JSON.stringify({ destinationId: 'deleteditems' }),
        }
      );

      // 404 = already deleted from Outlook - still clean up our DB
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('Failed to move message to trash:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      if (response.status === 404) {
        console.log(`Message ${message.externalMessageId} already deleted from Outlook, cleaning up DB`);
      }

      await ctx.runMutation(api.productivity.email.outlookActions.moveMessageToTrash, {
        userId: args.userId,
        messageId: args.messageId,
      });

      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return { success: false, error: String(error) };
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// ARCHIVE
// ═══════════════════════════════════════════════════════════════════════════

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

    // Check if token needs refresh
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

// ═══════════════════════════════════════════════════════════════════════════
// MARK READ/UNREAD
// ═══════════════════════════════════════════════════════════════════════════

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

    // Check if token needs refresh
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
      // PATCH the message to update isRead status
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

      // Local DB already updated via optimistic update - just confirm API success
      return { success: true };
    } catch (error) {
      console.error('Mark read/unread error:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * BATCH Mark Read/Unread - Uses Microsoft Graph Batch API
 *
 * Handles bulk operations without throttling:
 * - Batches up to 20 requests per API call (Microsoft limit)
 * - 200ms delay between batches to avoid rate limits
 * - Returns summary of successes/failures
 */
export const batchMarkOutlookReadStatus = action({
  args: {
    userId: v.id('admin_users'),
    messageIds: v.array(v.id('productivity_email_Index')),
    isRead: v.boolean(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; processed: number; failed: number; errors?: string[] }> => {
    const BATCH_SIZE = 20; // Microsoft Graph batch limit
    const BATCH_DELAY_MS = 200; // Delay between batches to avoid throttling

    // Get all messages with their external IDs
    const messages = await Promise.all(
      args.messageIds.map((id) =>
        ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
          userId: args.userId,
          messageId: id,
        })
      )
    );

    // Filter out null messages and get external IDs
    const validMessages = messages.filter((m): m is NonNullable<typeof m> => m !== null);

    if (validMessages.length === 0) {
      return { success: false, processed: 0, failed: args.messageIds.length, errors: ['No valid messages found'] };
    }

    // Get tokens
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) {
      return { success: false, processed: 0, failed: validMessages.length, errors: ['No Outlook access token'] };
    }

    // Refresh token if needed
    const accessToken = await ensureFreshToken(ctx, args.userId, tokens);
    if (!accessToken) {
      return { success: false, processed: 0, failed: validMessages.length, errors: ['Token refresh failed'] };
    }

    // Split into batches of 20
    const batches: typeof validMessages[] = [];
    for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
      batches.push(validMessages.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Batch sync: ${validMessages.length} messages in ${batches.length} batches`);

    let totalProcessed = 0;
    let totalFailed = 0;
    const errors: string[] = [];

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Build batch request body
      // Microsoft Graph Batch API: https://learn.microsoft.com/en-us/graph/json-batching
      const batchRequests = batch.map((msg, idx) => ({
        id: String(idx + 1),
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

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Batch ${batchIndex + 1} failed:`, errorText);
          totalFailed += batch.length;
          errors.push(`Batch ${batchIndex + 1}: ${response.status}`);
          continue;
        }

        const data = await response.json() as { responses: Array<{ id: string; status: number; body?: unknown }> };

        // Count successes and failures in this batch
        for (const res of data.responses) {
          if (res.status >= 200 && res.status < 300) {
            totalProcessed++;
          } else {
            totalFailed++;
            errors.push(`Message failed: ${res.status}`);
          }
        }

        console.log(`✅ Batch ${batchIndex + 1}/${batches.length}: ${batch.length} processed`);

        // Delay before next batch (except for last batch)
        if (batchIndex < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
        }
      } catch (error) {
        console.error(`❌ Batch ${batchIndex + 1} error:`, error);
        totalFailed += batch.length;
        errors.push(`Batch ${batchIndex + 1}: ${String(error)}`);
      }
    }

    console.log(`📦 Batch sync complete: ${totalProcessed} success, ${totalFailed} failed`);

    return {
      success: totalFailed === 0,
      processed: totalProcessed,
      failed: totalFailed,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined, // Limit errors to avoid huge payloads
    };
  },
});

