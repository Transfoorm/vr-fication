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

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL EMAIL TAXONOMY (inline copy for Convex runtime)
// Source of truth: /src/domains/email/canonical.ts
// ═══════════════════════════════════════════════════════════════════════════

/** Canonical folder values (provider-agnostic) */
const CanonicalFolder = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  ARCHIVE: 'archive',
  SPAM: 'spam',
  TRASH: 'trash',
  OUTBOX: 'outbox',
  SCHEDULED: 'scheduled',
  SYSTEM: 'system',
} as const;

/** Canonical state values (provider metadata) */
const CanonicalState = {
  UNREAD: 'unread',
  STARRED: 'starred',
  IMPORTANT: 'important',
  SNOOZED: 'snoozed',
  MUTED: 'muted',
  FOCUSED: 'focused',
  OTHER: 'other',
} as const;

type CanonicalFolderType = (typeof CanonicalFolder)[keyof typeof CanonicalFolder];
type CanonicalStateType = (typeof CanonicalState)[keyof typeof CanonicalState];

/** Outlook folder name → Canonical folder mapping */
const OUTLOOK_FOLDER_MAP: Record<string, CanonicalFolderType> = {
  // wellKnownName values
  inbox: CanonicalFolder.INBOX,
  sentitems: CanonicalFolder.SENT,
  drafts: CanonicalFolder.DRAFTS,
  deleteditems: CanonicalFolder.TRASH,
  junkemail: CanonicalFolder.SPAM,
  archive: CanonicalFolder.ARCHIVE,
  outbox: CanonicalFolder.OUTBOX,
  // Display names (fallback)
  'sent items': CanonicalFolder.SENT,
  sent: CanonicalFolder.SENT,
  'deleted items': CanonicalFolder.TRASH,
  trash: CanonicalFolder.TRASH,
  'junk email': CanonicalFolder.SPAM,
  junk: CanonicalFolder.SPAM,
  spam: CanonicalFolder.SPAM,
  scheduled: CanonicalFolder.SCHEDULED,
  // System folders
  'conversation history': CanonicalFolder.SYSTEM,
  'sync issues': CanonicalFolder.SYSTEM,
  conflicts: CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
  clutter: CanonicalFolder.SYSTEM,
};

/**
 * Maps Outlook folder to canonical folder.
 * Uses wellKnownName if available, falls back to displayName.
 *
 * @deprecated Phase 1 uses heuristics. Phase 2 will fetch folder metadata.
 */
function _mapOutlookFolderToCanonical(
  displayName?: string,
  wellKnownName?: string
): CanonicalFolderType {
  // Try wellKnownName first (most reliable)
  if (wellKnownName) {
    const mapped = OUTLOOK_FOLDER_MAP[wellKnownName.toLowerCase()];
    if (mapped) return mapped;
  }
  // Try displayName
  if (displayName) {
    const mapped = OUTLOOK_FOLDER_MAP[displayName.toLowerCase().trim()];
    if (mapped) return mapped;
  }
  // Unknown → SYSTEM (preserved, not dropped)
  return CanonicalFolder.SYSTEM;
}

// Re-export to satisfy unused detection (Phase 2 will use this)
export const __outlookFolderMapper = _mapOutlookFolderToCanonical;

/**
 * Extracts canonical states from Outlook message properties.
 */
function extractOutlookCanonicalStates(message: {
  isRead?: boolean;
  flag?: { flagStatus?: string };
  importance?: string;
  inferenceClassification?: string;
}): CanonicalStateType[] {
  const states: CanonicalStateType[] = [];

  // Unread state
  if (message.isRead === false) {
    states.push(CanonicalState.UNREAD);
  }

  // Flagged → Starred
  if (message.flag?.flagStatus === 'flagged') {
    states.push(CanonicalState.STARRED);
  }

  // High importance → Important
  if (message.importance === 'high') {
    states.push(CanonicalState.IMPORTANT);
  }

  // Focused Inbox classification
  if (message.inferenceClassification === 'focused') {
    states.push(CanonicalState.FOCUSED);
  } else if (message.inferenceClassification === 'other') {
    states.push(CanonicalState.OTHER);
  }

  return states;
}

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
    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      console.error('No Outlook tokens found');
      return { success: false, error: 'Not connected to Outlook' };
    }

    // Check if token is expired (with 5 min buffer)
    const now = Date.now();
    const tokenExpiresSoon = tokens.expiresAt < now + 5 * 60 * 1000;

    if (tokenExpiresSoon && tokens.refreshToken) {
      console.log('🔄 Access token expired, refreshing...');
      try {
        // Refresh the access token using Microsoft OAuth
        const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID || '',
            client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
            refresh_token: tokens.refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          }),
        });

        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error('Token refresh failed:', errorText);
          return { success: false, error: 'Token refresh failed - please reconnect Outlook' };
        }

        const refreshData = await refreshResponse.json() as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        // Store new tokens
        await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
          userId: args.userId,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || tokens.refreshToken,
          expiresAt: now + refreshData.expires_in * 1000,
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
        });

        // Update tokens for this sync
        tokens = {
          ...tokens,
          accessToken: refreshData.access_token,
          expiresAt: now + refreshData.expires_in * 1000,
        };
        console.log('✅ Token refreshed successfully');
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        return { success: false, error: 'Token refresh error - please reconnect Outlook' };
      }
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
            'parentFolderId', // For canonical folder mapping
            'categories', // Outlook user-defined categories
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

      // ─────────────────────────────────────────────────────────────────────
      // CANONICAL EMAIL TAXONOMY
      // Map Outlook properties to provider-agnostic canonical model
      // ─────────────────────────────────────────────────────────────────────

      // Determine canonical folder from message properties
      // Note: parentFolderId is a GUID - we use heuristics until folder lookup is implemented
      let canonicalFolder: CanonicalFolderType;
      if (message.isDraft) {
        canonicalFolder = CanonicalFolder.DRAFTS;
      } else if (isFromMe) {
        canonicalFolder = CanonicalFolder.SENT;
      } else {
        // Default to INBOX for received messages
        // Phase 2: Resolve parentFolderId → wellKnownName via Graph API
        canonicalFolder = CanonicalFolder.INBOX;
      }

      // Extract canonical states from message properties
      const canonicalStates = extractOutlookCanonicalStates({
        isRead: message.isRead,
        flag: message.flag,
        importance: message.importance,
        inferenceClassification: message.inferenceClassification,
      });

      // Provider categories (Outlook user-defined color categories)
      const providerCategories: string[] = message.categories || [];

      // Insert message with canonical taxonomy
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

        // Resolution state (Transfoorm workflow - separate from canonical)
        resolutionState,

        // ─────────────────────────────────────────────────────────────────
        // CANONICAL EMAIL TAXONOMY
        // ─────────────────────────────────────────────────────────────────
        canonicalFolder,
        canonicalStates,
        providerFolderId: message.parentFolderId || undefined,
        // providerFolderName: undefined, // Phase 2: Resolve via Graph API
        // providerLabels: undefined, // Gmail only
        providerCategories: providerCategories.length > 0 ? providerCategories : undefined,

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
