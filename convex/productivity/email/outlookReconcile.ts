/**
 * Outlook Reconciliation
 *
 * Handles re-syncing Convex state to Microsoft after rate limiting.
 * Called automatically 2 minutes after 429s detected.
 */

import { v } from 'convex/values';
import { query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Helper query: Get message read status
 */
export const getMessageReadStatus = query({
  args: {
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    return { _id: message._id, isRead: message.isRead };
  },
});

/**
 * Reconcile Read Status - Re-pushes Convex state to Microsoft
 *
 * Called after rate limiting detected. Ensures Microsoft mirrors Convex.
 * Reads current Convex state for each message, pushes to Microsoft.
 * Uses same batch mechanism as batchMarkOutlookReadStatus.
 */
export const reconcileReadStatus = action({
  args: {
    userId: v.id('admin_users'),
    messageIds: v.array(v.id('productivity_email_Index')),
  },
  handler: async (ctx, args): Promise<{ success: boolean; reconciled: number; failed: number }> => {
    console.log(`🔄 Reconciliation starting for ${args.messageIds.length} messages`);

    // Get all messages with their current Convex state
    const messages = await Promise.all(
      args.messageIds.map(async (id) => {
        const msg = await ctx.runQuery(api.productivity.email.outlookActions.getMessageById, {
          userId: args.userId,
          messageId: id,
        });
        if (!msg) return null;
        // Also get the isRead status from the full message
        const fullMsg = await ctx.runQuery(api.productivity.email.outlookReconcile.getMessageReadStatus, {
          messageId: id,
        });
        return fullMsg ? { ...msg, isRead: fullMsg.isRead } : null;
      })
    );

    // Group by isRead status
    const readMessages = messages.filter((m): m is NonNullable<typeof m> & { isRead: true } => m !== null && m.isRead === true);
    const unreadMessages = messages.filter((m): m is NonNullable<typeof m> & { isRead: false } => m !== null && m.isRead === false);

    let totalReconciled = 0;
    let totalFailed = 0;

    // Re-push READ messages
    if (readMessages.length > 0) {
      const readResult = await ctx.runAction(api.productivity.email.outlookActions.batchMarkOutlookReadStatus, {
        userId: args.userId,
        messageIds: readMessages.map(m => m._id) as Id<'productivity_email_Index'>[],
        isRead: true,
      });
      totalReconciled += readResult.processed;
      totalFailed += readResult.failed;
    }

    // Re-push UNREAD messages
    if (unreadMessages.length > 0) {
      const unreadResult = await ctx.runAction(api.productivity.email.outlookActions.batchMarkOutlookReadStatus, {
        userId: args.userId,
        messageIds: unreadMessages.map(m => m._id) as Id<'productivity_email_Index'>[],
        isRead: false,
      });
      totalReconciled += unreadResult.processed;
      totalFailed += unreadResult.failed;
    }

    console.log(`🔄 Reconciliation complete: ${totalReconciled} ok, ${totalFailed} failed`);

    return {
      success: totalFailed === 0,
      reconciled: totalReconciled,
      failed: totalFailed,
    };
  },
});
