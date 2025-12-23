/**─────────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK EMAIL SYNC - Convex Functions                                 │
│  /convex/productivity/email/outlook.ts                                    │
│                                                                           │
│  OAuth token management + metadata sync from Microsoft Graph API          │
└───────────────────────────────────────────────────────────────────────────┘ */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Store Outlook OAuth tokens for current user
 *
 * Creates/updates account in productivity_email_Accounts table
 */
export const storeOutlookTokens = mutation({
  args: {
    userId: v.id('admin_users'), // User ID from OAuth state
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    emailAddress: v.optional(v.string()), // User's email from Graph API
  },
  handler: async (ctx, args) => {
    // Get user from provided userId
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    // Check if Outlook account already exists for this user
    const existingAccount = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    const now = Date.now();

    if (existingAccount) {
      // Update existing account
      await ctx.db.patch(existingAccount._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.expiresAt,
        status: 'active',
        lastSyncError: undefined,
        updatedAt: now,
      });
      console.log(`✅ Updated Outlook account ${existingAccount._id}`);
    } else {
      // Create new account
      await ctx.db.insert('productivity_email_Accounts', {
        label: 'Outlook',
        emailAddress: args.emailAddress || user.email || 'unknown@outlook.com',
        provider: 'outlook',
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.expiresAt,
        syncFrequency: 5 * 60 * 1000, // 5 minutes
        syncEnabled: true,
        status: 'active',
        orgId: user.orgSlug || user._id, // TODO: Use proper orgId when orgs domain is implemented
        userId: user._id,
        createdAt: now,
        updatedAt: now,
        connectedAt: now,
      });
      console.log(`✅ Created Outlook account for user ${user._id}`);
    }
  },
});

/**
 * Get Outlook tokens for current user
 */
export const getOutlookTokens = query({
  args: {
    userId: v.id('admin_users'), // User ID to get tokens for
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Get Outlook account from productivity_email_Accounts
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account || !account.accessToken) return null;

    return {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken || '',
      expiresAt: account.tokenExpiresAt || 0,
      scope: '', // Not stored in account table
    };
  },
});

/**
 * Check if Outlook is connected for current user
 */
export const isOutlookConnected = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const clerkRecord = await ctx.db
      .query('admin_users_ClerkRegistry')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!clerkRecord) return false;

    const user = await ctx.db.get(clerkRecord.userId);
    if (!user) return false;

    // Check if Outlook account exists
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    return !!(account?.accessToken && account.status === 'active');
  },
});

/**
 * Trigger Outlook email sync (calls action)
 */
export const triggerOutlookSync = mutation({
  args: {
    userId: v.id('admin_users'), // User ID from OAuth state
  },
  handler: async (ctx, args) => {
    // Schedule sync action to run in background
    await ctx.scheduler.runAfter(0, api.productivity.email.outlook.syncOutlookMessages, {
      userId: args.userId,
    });

    console.log(`📧 Outlook sync triggered for user ${args.userId}`);
  },
});

/**
 * Sync messages from Outlook Graph API
 *
 * PHASE 1 IMPLEMENTATION:
 * - Paginated sync: fetches ALL emails via @odata.nextLink
 * - Stores HTML bodies in Convex storage
 * - Broken images expected (asset rewriting is Phase 2)
 *
 * This is an action (not mutation) so it can make external HTTP requests
 */
export const syncOutlookMessages = action({
  args: {
    userId: v.id('admin_users'), // User ID to sync for
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageCount?: number; pagesProcessed?: number; error?: string }> => {
    // Get tokens from database
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      console.error('No Outlook tokens found');
      return { success: false, error: 'Not connected to Outlook' };
    }

    try {
      let totalMessages = 0;
      let pagesProcessed = 0;
      const BATCH_SIZE = 50; // Smaller batches to avoid Convex mutation size limits

      // Build initial URL with fields we need
      let nextUrl: string | null =
        'https://graph.microsoft.com/v1.0/me/messages?' +
        new URLSearchParams({
          $select: [
            'id',
            'conversationId',
            'subject',
            'from',
            'toRecipients',
            'ccRecipients',
            'receivedDateTime',
            'sentDateTime',
            'hasAttachments',
            'importance',
            'isRead',
            'isDraft',
            'webLink',
            'bodyPreview',
            'body', // Full HTML/text body for storage
            'inferenceClassification',
            'flag',
          ].join(','),
          $top: String(BATCH_SIZE),
          $orderby: 'receivedDateTime desc',
        });

      console.log('📧 Starting paginated Outlook sync...');

      // Paginate through ALL messages
      while (nextUrl) {
        const response: Response = await fetch(nextUrl, {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText: string = await response.text();
          console.error('Graph API error:', errorText);
          throw new Error(`Graph API returned ${response.status}`);
        }

        const data = (await response.json()) as {
          value: unknown[];
          '@odata.nextLink'?: string;
        };

        const messages: unknown[] = data.value;
        pagesProcessed++;

        console.log(`📧 Page ${pagesProcessed}: Fetched ${messages.length} messages`);

        if (messages.length > 0) {
          // Store HTML bodies in Convex storage first (actions have storage access)
          const bodyStorageMap: Record<string, string> = {};

          for (const msg of messages as Array<{
            id: string;
            body?: { contentType?: string; content?: string };
          }>) {
            if (msg.body?.content) {
              try {
                // Create blob from body HTML/text content
                const contentType = msg.body.contentType === 'html' ? 'text/html' : 'text/plain';
                const blob = new Blob([msg.body.content], { type: contentType });
                const storageId = await ctx.storage.store(blob);
                bodyStorageMap[msg.id] = storageId;
              } catch (err) {
                console.warn(`⚠️ Failed to store body for ${msg.id}:`, err);
              }
            }
          }

          // Store messages with body storage references
          await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
            userId: args.userId,
            messages,
            bodyStorageMap,
          });
          totalMessages += messages.length;
        }

        // Get next page URL (Microsoft Graph pagination)
        nextUrl = data['@odata.nextLink'] || null;

        // Safety valve: stop after 100 pages (5000 emails) to prevent runaway syncs
        if (pagesProcessed >= 100) {
          console.warn('⚠️ Reached 100 pages limit, stopping sync');
          break;
        }
      }

      console.log(`✅ Outlook sync complete: ${totalMessages} messages across ${pagesProcessed} pages`);
      return { success: true, messageCount: totalMessages, pagesProcessed };
    } catch (error) {
      console.error('Outlook sync error:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Store Outlook messages in Convex database
 *
 * PHASE 1: Stores messages with HTML bodies in Convex storage
 * - Creates entries in productivity_email_Index
 * - Creates body assets in productivity_email_Assets
 * - Links assets via bodyAssetId
 *
 * Note: Images will be broken (Phase 2 handles asset rewriting)
 */
export const storeOutlookMessages = mutation({
  args: {
    userId: v.id('admin_users'), // User ID to store messages for
    messages: v.array(v.any()), // OutlookMessage[] (typed on client)
    bodyStorageMap: v.optional(v.record(v.string(), v.string())), // externalMessageId → storageId
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    // Get Outlook account
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    let messagesStored = 0;
    const now = Date.now();

    // Store each message individually
    for (const message of args.messages) {
      // Check if message already exists
      const existing = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_external_message_id', (q) =>
          q.eq('externalMessageId', message.id)
        )
        .first();

      if (existing) {
        console.log(`⏭️  Skipping duplicate message ${message.id}`);
        continue;
      }

      // Parse recipients
      const toRecipients = (message.toRecipients || []).map((r: unknown) => {
        const recipient = r as { emailAddress?: { name?: string; address?: string } };
        return {
          name: recipient.emailAddress?.name || '',
          email: recipient.emailAddress?.address || '',
        };
      });

      const ccRecipients = (message.ccRecipients || []).map((r: unknown) => {
        const recipient = r as { emailAddress?: { name?: string; address?: string } };
        return {
          name: recipient.emailAddress?.name || '',
          email: recipient.emailAddress?.address || '',
        };
      });

      // Determine initial resolution state
      const isFromMe = message.from?.emailAddress?.address === user.email;
      const isUnread = !message.isRead;
      let resolutionState: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none' = 'none';

      if (isUnread && !isFromMe) {
        resolutionState = 'awaiting_me';
      } else if (isFromMe) {
        resolutionState = 'awaiting_them';
      }

      // Phase 1: Create body asset if we have storage for it
      let bodyAssetId: Id<'productivity_email_Assets'> | undefined = undefined;
      let assetCount = 0;

      const bodyStorageId = args.bodyStorageMap?.[message.id];
      if (bodyStorageId) {
        // Get body metadata for asset record
        const bodyContent = message.body?.content || '';
        const contentType = message.body?.contentType === 'html' ? 'text/html' : 'text/plain';

        // Create content hash for deduplication (simple hash for Phase 1)
        const hash = `outlook-body-${message.id}`;
        const key = `email-assets/body/${hash}`;

        // Create asset record
        const assetId = await ctx.db.insert('productivity_email_Assets', {
          hash,
          key,
          contentType,
          size: new TextEncoder().encode(bodyContent).length,
          source: 'body',
          storageId: bodyStorageId as Id<'_storage'>,
          lastAccessedAt: now,
          referenceCount: 1,
          createdAt: now,
          updatedAt: now,
        });

        bodyAssetId = assetId;
        assetCount = 1;
      }

      // Insert message with body asset link
      await ctx.db.insert('productivity_email_Index', {
        // External IDs
        externalMessageId: message.id,
        externalThreadId: message.conversationId,

        // Message metadata
        subject: message.subject || '(No subject)',
        snippet: message.bodyPreview || '',
        from: {
          name: message.from?.emailAddress?.name || '',
          email: message.from?.emailAddress?.address || '',
        },
        to: toRecipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        receivedAt: new Date(message.receivedDateTime).getTime(),
        hasAttachments: message.hasAttachments,
        isRead: message.isRead || false,

        // Connected account
        accountId: account._id,

        // Resolution state
        resolutionState,

        // Body asset (Phase 1: HTML stored, images may be broken)
        bodyAssetId,
        assetsProcessed: !!bodyAssetId, // Body is processed if we have it
        assetsProcessedAt: bodyAssetId ? now : undefined,
        assetCount,

        // SRS rank-scoping
        // 🛡️ SID-ORG: Use userId directly until orgs domain is implemented
        // orgSlug may contain test/default values like "go" - ignore it for now
        orgId: user._id as string,

        // Timestamps
        createdAt: now,
        updatedAt: now,
      });

      messagesStored++;
    }

    console.log(`✅ Stored ${messagesStored} messages, scheduled asset processing`);

    return { messagesStored };
  },
});

/**
 * Disconnect Outlook account
 * Clears OAuth tokens and marks account as disconnected
 */
export const disconnectOutlookAccount = mutation({
  args: {
    userId: v.id('admin_users'),
    accountId: v.id('productivity_email_Accounts'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db.get(args.accountId);
    if (!account) throw new Error('Account not found');

    // Verify ownership
    if (account.userId !== user._id) {
      throw new Error('Account does not belong to user');
    }

    // Mark account as disconnected and clear tokens
    await ctx.db.patch(args.accountId, {
      status: 'disconnected',
      accessToken: undefined,
      refreshToken: undefined,
      disconnectedAt: Date.now(),
    });

    console.log(`✅ Disconnected Outlook account ${account.emailAddress}`);
    return { success: true };
  },
});
