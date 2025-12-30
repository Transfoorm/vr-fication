/**
 * Outlook User Actions
 *
 * Message operations initiated by users: trash, archive, delete.
 * Each action: Graph API call → local state update.
 */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';

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

    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to move message to trash:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
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

    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to archive message:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
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
