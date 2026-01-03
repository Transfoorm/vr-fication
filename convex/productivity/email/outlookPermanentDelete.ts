// Permanent delete operations for Outlook messages (trash items)
import { v } from 'convex/values';
import { mutation, action, ActionCtx } from '@/convex/_generated/server';
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

// Permanently delete a message from Convex DB
export const permanentlyDeleteMessage = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error('Message not found');

    // Delete the message from the database
    await ctx.db.delete(args.messageId);

    return { success: true };
  },
});

// Permanently delete a message from Outlook AND our DB (for trash items)
export const permanentlyDeleteOutlookMessage = action({
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

    const accessToken = await ensureFreshToken(ctx, args.userId, tokens);
    if (!accessToken) return { success: false, error: 'Token refresh failed' };

    try {
      // DELETE request permanently removes the message from Outlook
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // 404 = already deleted from Outlook - still clean up our DB
      // 204 = successful delete (no content)
      if (!response.ok && response.status !== 404 && response.status !== 204) {
        const errorText = await response.text();
        console.error('Failed to permanently delete message:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      // Delete from our database
      await ctx.runMutation(api.productivity.email.outlookPermanentDelete.permanentlyDeleteMessage, {
        userId: args.userId,
        messageId: args.messageId,
      });

      return { success: true };
    } catch (error) {
      console.error('Permanent delete error:', error);
      return { success: false, error: String(error) };
    }
  },
});
