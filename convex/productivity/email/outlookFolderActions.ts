/**
 * Outlook Folder Actions
 *
 * Folder operations initiated by users: get, delete, move to trash.
 * Split from outlookActions.ts for VRP file size compliance.
 */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER QUERIES
// ═══════════════════════════════════════════════════════════════════════════

export const getFolderById = query({
  args: {
    userId: v.id('admin_users'),
    folderId: v.id('productivity_email_Folders'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const folder = await ctx.db.get(args.folderId);
    if (!folder) return null;

    return {
      _id: folder._id,
      externalFolderId: folder.externalFolderId,
      displayName: folder.displayName,
      canonicalFolder: folder.canonicalFolder,
      accountId: folder.accountId,
      parentFolderId: folder.parentFolderId,
    };
  },
});

export const getFolderByExternalId = query({
  args: {
    userId: v.id('admin_users'),
    externalFolderId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!account) return null;

    const folder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .filter((q) => q.eq(q.field('externalFolderId'), args.externalFolderId))
      .first();

    if (!folder) return null;

    return {
      _id: folder._id,
      externalFolderId: folder.externalFolderId,
      displayName: folder.displayName,
      canonicalFolder: folder.canonicalFolder,
      accountId: folder.accountId,
      parentFolderId: folder.parentFolderId,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const removeFolderFromDb = mutation({
  args: {
    userId: v.id('admin_users'),
    folderId: v.id('productivity_email_Folders'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const folder = await ctx.db.get(args.folderId);
    if (!folder) throw new Error('Folder not found');

    // Delete all messages in this folder
    const messages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', folder.accountId))
      .filter((q) => q.eq(q.field('providerFolderId'), folder.externalFolderId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the folder
    await ctx.db.delete(args.folderId);

    return { success: true, messagesDeleted: messages.length };
  },
});

export const moveFolderToTrash = mutation({
  args: {
    userId: v.id('admin_users'),
    folderId: v.id('productivity_email_Folders'),
    newExternalFolderId: v.string(), // Microsoft gives new ID after move
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const folder = await ctx.db.get(args.folderId);
    if (!folder) throw new Error('Folder not found');

    // Find the Deleted Items folder to get its externalFolderId
    const trashFolder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', folder.accountId))
      .filter((q) => q.eq(q.field('canonicalFolder'), 'trash'))
      .first();

    // Update folder: new ID, new parent (Deleted Items), new canonical (trash)
    await ctx.db.patch(args.folderId, {
      externalFolderId: args.newExternalFolderId,
      parentFolderId: trashFolder?.externalFolderId,
      canonicalFolder: 'trash',
      updatedAt: Date.now(),
    });

    // Update all messages in this folder to reflect the move
    const messages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', folder.accountId))
      .filter((q) => q.eq(q.field('providerFolderId'), folder.externalFolderId))
      .collect();

    for (const message of messages) {
      await ctx.db.patch(message._id, {
        providerFolderId: args.newExternalFolderId,
        canonicalFolder: 'trash',
      });
    }

    console.log(`📁 Moved folder to trash: ${folder.displayName}, updated ${messages.length} messages`);
    return { success: true, messagesUpdated: messages.length };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER ACTIONS
// ═══════════════════════════════════════════════════════════════════════════

export const deleteOutlookFolder = action({
  args: {
    userId: v.id('admin_users'),
    folderId: v.id('productivity_email_Folders'),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const folder = await ctx.runQuery(api.productivity.email.outlookFolderActions.getFolderById, {
      userId: args.userId,
      folderId: args.folderId,
    });

    if (!folder) return { success: false, error: 'Folder not found' };

    // Prevent deleting ROOT system folders (no parent = root folder)
    // Subfolders of Inbox etc. can still be deleted
    const systemFolders = ['inbox', 'sent', 'drafts', 'trash', 'archive', 'spam', 'junk'];
    const isRootSystemFolder = !folder.parentFolderId && systemFolders.includes(folder.canonicalFolder);

    console.log('🗑️ Delete folder check:', {
      displayName: folder.displayName,
      canonicalFolder: folder.canonicalFolder,
      parentFolderId: folder.parentFolderId,
      isRootSystemFolder,
    });

    if (isRootSystemFolder) {
      return { success: false, error: 'Cannot delete system folders' };
    }

    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) return { success: false, error: 'No Outlook access token' };

    // Check if token needs refresh (expires within 5 minutes)
    const now = Date.now();
    if (tokens.expiresAt && tokens.expiresAt < now + 5 * 60 * 1000) {
      console.log('🔄 Token expired or expiring soon, refreshing...');
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

        if (!refreshResponse.ok) {
          console.error('Token refresh failed');
          return { success: false, error: 'Token expired - please reconnect Outlook' };
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

        tokens = { ...tokens, accessToken: refreshData.access_token };
        console.log('✅ Token refreshed successfully');
      } catch {
        return { success: false, error: 'Token refresh failed - please reconnect Outlook' };
      }
    }

    try {
      // If folder is already in trash → PERMANENT DELETE
      // Otherwise → MOVE to Deleted Items
      // Check both canonicalFolder AND if parent is trash (for nested folders like Kenn.org/Expenses)
      let isAlreadyInTrash = folder.canonicalFolder === 'trash';

      // Also check if parent folder is in Deleted Items
      if (!isAlreadyInTrash && folder.parentFolderId) {
        const parentFolder = await ctx.runQuery(api.productivity.email.outlookFolderActions.getFolderByExternalId, {
          userId: args.userId,
          externalFolderId: folder.parentFolderId,
        });
        if (parentFolder?.canonicalFolder === 'trash') {
          isAlreadyInTrash = true;
        }
      }

      if (isAlreadyInTrash) {
        // PERMANENT DELETE - folder is already in Deleted Items
        console.log(`🗑️ Permanently deleting folder: ${folder.displayName}`);
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to permanently delete folder:', errorText);
          return { success: false, error: `Outlook API error: ${response.status}` };
        }

        // Remove from our DB entirely
        await ctx.runMutation(api.productivity.email.outlookFolderActions.removeFolderFromDb, {
          userId: args.userId,
          folderId: args.folderId,
        });

        console.log(`🗑️ Permanently deleted folder: ${folder.displayName}`);
        return { success: true };
      } else {
        // MOVE to Deleted Items (soft delete)
        console.log(`🗑️ Moving folder to Deleted Items: ${folder.displayName}`);
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}/move`,
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
          console.error('Failed to move folder to trash:', errorText);
          return { success: false, error: `Outlook API error: ${response.status}` };
        }

        // Get the moved folder's new ID (Microsoft returns updated folder)
        const movedFolder = await response.json();
        console.log(`🗑️ Moved folder to Deleted Items: ${folder.displayName} → new ID: ${movedFolder.id}`);

        // Update our DB - change parent to Deleted Items, update canonicalFolder to trash
        await ctx.runMutation(api.productivity.email.outlookFolderActions.moveFolderToTrash, {
          userId: args.userId,
          folderId: args.folderId,
          newExternalFolderId: movedFolder.id,
        });

        return { success: true };
      }
    } catch (error) {
      console.error('Delete folder error:', error);
      return { success: false, error: String(error) };
    }
  },
});
