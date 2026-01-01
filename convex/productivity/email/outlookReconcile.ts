/**
 * Outlook Reconciliation
 *
 * External truth reconciliation & data hygiene.
 * Verifies local DB state against Microsoft Graph API.
 * Removes orphaned messages that no longer exist in Outlook.
 */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';

// ═══════════════════════════════════════════════════════════════════════════
// RECONCILIATION - Remove orphaned messages that no longer exist in Outlook
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get messages to reconcile (batch for API checking)
 */
export const getMessagesForReconciliation = query({
  args: {
    userId: v.id('admin_users'),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { messages: [], total: 0 };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!account) return { messages: [], total: 0 };

    const allMessages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;
    const batch = allMessages.slice(offset, offset + limit);

    return {
      messages: batch.map(m => ({
        _id: m._id,
        externalMessageId: m.externalMessageId,
        subject: m.subject,
      })),
      total: allMessages.length,
      hasMore: offset + limit < allMessages.length,
    };
  },
});

/**
 * Delete orphaned message from our DB
 */
export const deleteOrphanedMessage = mutation({
  args: {
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return { success: false };

    // Delete body cache if exists
    const cacheEntry = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_message', (q) => q.eq('messageId', message.externalMessageId))
      .first();

    if (cacheEntry) {
      await ctx.storage.delete(cacheEntry.storageId);
      await ctx.db.delete(cacheEntry._id);
    }

    await ctx.db.delete(args.messageId);
    return { success: true };
  },
});

/**
 * Reconcile messages - check against Outlook and remove orphans
 * Uses individual GET requests (Graph API batch is complex, this is more reliable)
 */
export const reconcileMessages = action({
  args: {
    userId: v.id('admin_users'),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    checked: number;
    orphansRemoved: number;
    error?: string;
  }> => {
    const batchSize = args.batchSize ?? 20; // Graph API batch limit is 20

    // Get tokens
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) {
      return { success: false, checked: 0, orphansRemoved: 0, error: 'No access token' };
    }

    // Get messages to check
    const { messages, total } = await ctx.runQuery(
      api.productivity.email.outlookReconcile.getMessagesForReconciliation,
      { userId: args.userId, limit: batchSize }
    );

    if (messages.length === 0) {
      return { success: true, checked: 0, orphansRemoved: 0 };
    }

    console.log(`🔄 Reconciling ${messages.length} of ${total} messages...`);

    let orphansRemoved = 0;

    // Check each message against Outlook (using individual GET requests)
    // Graph API batch is complex, simple GET check is more reliable
    for (const message of messages) {
      try {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}?$select=id`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (response.status === 404) {
          // Message doesn't exist in Outlook - remove from our DB
          console.log(`🗑️ Removing orphan: ${message.subject?.substring(0, 30)}...`);
          await ctx.runMutation(api.productivity.email.outlookReconcile.deleteOrphanedMessage, {
            messageId: message._id,
          });
          orphansRemoved++;
        }
        // 200 = exists, 401/403 = token issue (don't delete), other = skip
      } catch {
        // Network error - skip this message
      }
    }

    console.log(`✅ Reconciliation: checked ${messages.length}, removed ${orphansRemoved} orphans`);

    return {
      success: true,
      checked: messages.length,
      orphansRemoved,
    };
  },
});
