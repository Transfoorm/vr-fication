/**──────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK EMAIL SYNC - Convex Functions                              │
│  /convex/productivity/email/outlook.ts                                │
│                                                                        │
│  OAuth token management + metadata sync from Microsoft Graph API      │
└────────────────────────────────────────────────────────────────────────┘ */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';

/**
 * Store Outlook OAuth tokens for current user
 *
 * Creates/updates account in productivity_email_Accounts table
 */
export const storeOutlookTokens = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    emailAddress: v.optional(v.string()), // User's email from Graph API
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Find user via Clerk Registry (S.I.D. compliant)
    const clerkRecord = await ctx.db
      .query('admin_users_ClerkRegistry')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!clerkRecord) throw new Error('Clerk registry entry not found');

    const user = await ctx.db.get(clerkRecord.userId);
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
        emailAddress: args.emailAddress || identity.email || 'unknown@outlook.com',
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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const clerkRecord = await ctx.db
      .query('admin_users_ClerkRegistry')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!clerkRecord) return null;

    const user = await ctx.db.get(clerkRecord.userId);
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
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Schedule sync action to run in background
    await ctx.scheduler.runAfter(0, api.productivity.email.outlook.syncOutlookMessages, {});

    console.log(`📧 Outlook sync triggered for user ${identity.subject}`);
  },
});

/**
 * Sync messages from Outlook Graph API
 *
 * This is an action (not mutation) so it can make external HTTP requests
 */
export const syncOutlookMessages = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; messageCount?: number; error?: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    // Get tokens from database
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {});
    if (!tokens) {
      console.error('No Outlook tokens found');
      return { success: false, error: 'Not connected to Outlook' };
    }

    try {
      // Fetch messages from Microsoft Graph API
      const response: Response = await fetch(
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
              'inferenceClassification',
              'flag',
            ].join(','),
            $top: '100', // Fetch last 100 messages initially
            $orderby: 'receivedDateTime desc',
          }),
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText: string = await response.text();
        console.error('Graph API error:', errorText);
        throw new Error(`Graph API returned ${response.status}`);
      }

      const data: { value: unknown[] } = await response.json();
      const messages: unknown[] = data.value;

      console.log(`📧 Fetched ${messages.length} messages from Outlook`);

      // Store messages in Convex (call mutation)
      await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
        messages,
      });

      return { success: true, messageCount: messages.length };
    } catch (error) {
      console.error('Outlook sync error:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Store Outlook messages in Convex database
 *
 * Stores individual messages in productivity_email_Index table
 */
export const storeOutlookMessages = mutation({
  args: {
    messages: v.array(v.any()), // OutlookMessage[] (typed on client)
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const clerkRecord = await ctx.db
      .query('admin_users_ClerkRegistry')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject))
      .first();

    if (!clerkRecord) throw new Error('Clerk registry entry not found');

    const user = await ctx.db.get(clerkRecord.userId);
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
      const isFromMe = message.from?.emailAddress?.address === identity.email;
      const isUnread = !message.isRead;
      let resolutionState: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none' = 'none';

      if (isUnread && !isFromMe) {
        resolutionState = 'awaiting_me';
      } else if (isFromMe) {
        resolutionState = 'awaiting_them';
      }

      // Insert message
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

        // Body fetch status
        bodyFetched: false,

        // SRS rank-scoping
        orgId: user.orgSlug || user._id, // TODO: Use proper orgId when orgs domain is implemented

        // Timestamps
        createdAt: now,
        updatedAt: now,
      });

      messagesStored++;
    }

    console.log(`✅ Stored ${messagesStored} messages`);

    return { messagesStored };
  },
});
