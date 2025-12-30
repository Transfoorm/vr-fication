/**
 * Outlook Diagnostics & Operations
 *
 * Admin tools, debug queries, migrations, resets.
 * Not part of steady-state sync.
 */

import { v } from 'convex/values';
import { mutation, query } from '@/convex/_generated/server';
import { Id } from '@/convex/_generated/dataModel';

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNT DISCONNECT (Destructive cascade)
// ═══════════════════════════════════════════════════════════════════════════

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

    if (account.userId !== user._id) throw new Error('Account does not belong to user');

    // 1. Delete body cache entries
    const cacheEntries = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let cacheBodiesDeleted = 0;
    for (const entry of cacheEntries) {
      await ctx.storage.delete(entry.storageId);
      await ctx.db.delete(entry._id);
      cacheBodiesDeleted++;
    }

    // 2. Get all messages
    const messages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    // 3. Delete AssetReferences
    const assetIdsToCheck = new Set<string>();
    let assetRefsDeleted = 0;

    for (const msg of messages) {
      const refs = await ctx.db
        .query('productivity_email_AssetReferences')
        .withIndex('by_message', (q) => q.eq('messageId', msg._id))
        .collect();

      for (const ref of refs) {
        assetIdsToCheck.add(ref.assetId);
        await ctx.db.delete(ref._id);
        assetRefsDeleted++;
      }
    }

    // 4. Clean up orphaned Assets
    let assetsDeleted = 0;
    let storageBlobsDeleted = 0;

    for (const assetIdStr of assetIdsToCheck) {
      const assetId = assetIdStr as Id<'productivity_email_Assets'>;
      const asset = await ctx.db.get(assetId);
      if (!asset) continue;

      const remainingRefs = await ctx.db
        .query('productivity_email_AssetReferences')
        .withIndex('by_asset', (q) => q.eq('assetId', assetId))
        .first();

      if (!remainingRefs) {
        if (asset.storageId) {
          await ctx.storage.delete(asset.storageId);
          storageBlobsDeleted++;
        }
        await ctx.db.delete(asset._id);
        assetsDeleted++;
      }
    }

    // 5. Delete all messages
    let messagesDeleted = 0;
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
      messagesDeleted++;
    }

    // 6. Delete all folders
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let foldersDeleted = 0;
    for (const folder of folders) {
      await ctx.db.delete(folder._id);
      foldersDeleted++;
    }

    // 7. Delete webhook subscriptions
    const webhooks = await ctx.db
      .query('productivity_email_WebhookSubscriptions')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let webhooksDeleted = 0;
    for (const webhook of webhooks) {
      await ctx.db.delete(webhook._id);
      webhooksDeleted++;
    }

    // 8. GC sweep for orphaned assets
    const allAssets = await ctx.db.query('productivity_email_Assets').collect();

    for (const asset of allAssets) {
      const hasRefs = await ctx.db
        .query('productivity_email_AssetReferences')
        .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
        .first();

      if (!hasRefs) {
        if (asset.storageId) {
          await ctx.storage.delete(asset.storageId);
        }
        await ctx.db.delete(asset._id);
      }
    }

    // 9. Delete the account
    await ctx.db.delete(args.accountId);

    console.log(`Disconnected ${account.emailAddress}: ${messagesDeleted} msgs, ${foldersDeleted} folders`);

    return {
      success: true,
      messagesDeleted,
      assetRefsDeleted,
      assetsDeleted,
      storageBlobsDeleted,
      foldersDeleted,
      cacheBodiesDeleted,
      webhooksDeleted,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// DEBUG QUERIES
// ═══════════════════════════════════════════════════════════════════════════

export const debugListAllFolders = query({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { error: 'User not found' };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { error: 'No Outlook account found' };

    const allFolders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const EXCLUDED_CANONICAL = ['system'];

    return {
      accountId: account._id,
      initialSyncComplete: account.initialSyncComplete ?? false,
      totalFolders: allFolders.length,
      folders: allFolders.map((f) => ({
        displayName: f.displayName,
        externalFolderId: f.externalFolderId.substring(0, 40) + '...',
        canonicalFolder: f.canonicalFolder,
        parentFolderId: f.parentFolderId ? f.parentFolderId.substring(0, 20) + '...' : null,
        wouldBeSynced: !EXCLUDED_CANONICAL.includes(f.canonicalFolder),
        hasDeltaToken: !!f.deltaToken,
      })),
    };
  },
});

export const debugFolderMessageCounts = query({
  args: {},
  handler: async (ctx) => {
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { error: 'No Outlook account found' };

    const allFolders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const allMessages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const folderCounts = new Map<string, { total: number; unread: number }>();
    const canonicalCounts = new Map<string, { total: number; unread: number }>();

    for (const msg of allMessages) {
      const folderId = msg.providerFolderId || 'unknown';
      const canonical = msg.canonicalFolder || 'inbox';

      const folderStats = folderCounts.get(folderId) || { total: 0, unread: 0 };
      folderStats.total++;
      if (!msg.isRead) folderStats.unread++;
      folderCounts.set(folderId, folderStats);

      const canonStats = canonicalCounts.get(canonical) || { total: 0, unread: 0 };
      canonStats.total++;
      if (!msg.isRead) canonStats.unread++;
      canonicalCounts.set(canonical, canonStats);
    }

    const folderIdToName = new Map<string, string>();
    for (const f of allFolders) {
      folderIdToName.set(f.externalFolderId, f.displayName);
    }

    const byFolder = Array.from(folderCounts.entries())
      .map(([folderId, stats]) => ({
        folderName: folderIdToName.get(folderId) || `Unknown (${folderId.substring(0, 20)}...)`,
        ...stats,
      }))
      .sort((a, b) => b.total - a.total);

    const byCanonical = Array.from(canonicalCounts.entries())
      .map(([canonical, stats]) => ({ canonical, ...stats }))
      .sort((a, b) => b.total - a.total);

    return {
      accountId: account._id,
      userId: account.userId,
      totalMessages: allMessages.length,
      totalFolders: allFolders.length,
      byFolder,
      byCanonical,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// STATUS QUERIES
// ═══════════════════════════════════════════════════════════════════════════

export const getAccountFolderCacheStatus = query({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return null;
    return { foldersCachedAt: account.foldersCachedAt };
  },
});

export const getAccountInitialSyncStatus = query({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return null;

    return {
      accountId: account._id,
      initialSyncComplete: account.initialSyncComplete ?? false,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// RESET MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const resetSyncState = mutation({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { success: false, error: 'User not found' };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { success: false, error: 'No Outlook account found' };

    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    let cleared = 0;
    for (const folder of folders) {
      if (folder.deltaToken) {
        await ctx.db.patch(folder._id, { deltaToken: undefined, deltaTokenUpdatedAt: undefined });
        cleared++;
      }
    }

    await ctx.db.patch(account._id, { syncStartedAt: undefined, lastSyncError: undefined });

    return { success: true, tokensCleared: cleared };
  },
});

export const resetInitialSyncFlag = mutation({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    await ctx.db.patch(account._id, { initialSyncComplete: false, updatedAt: Date.now() });

    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    for (const folder of folders) {
      if (folder.deltaToken) {
        await ctx.db.patch(folder._id, { deltaToken: undefined, deltaTokenUpdatedAt: undefined });
      }
    }

    return { success: true, foldersCleared: folders.length };
  },
});

export const resetStuckSync = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('productivity_email_Accounts').collect();
    let reset = 0;

    for (const account of accounts) {
      if (account.isSyncing) {
        await ctx.db.patch(account._id, { isSyncing: false });
        reset++;
      }
    }

    return { reset, message: `Reset ${reset} account(s)` };
  },
});

export const markInitialSyncComplete = mutation({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    await ctx.db.patch(account._id, { initialSyncComplete: true, updatedAt: Date.now() });

    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN / MIGRATION
// ═══════════════════════════════════════════════════════════════════════════

export const backfillOwnerEmail = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('productivity_email_Accounts').collect();
    let updated = 0;

    for (const account of accounts) {
      if (!account.ownerEmail && account.userId) {
        const user = await ctx.db.get(account.userId);
        if (user?.email) {
          await ctx.db.patch(account._id, { ownerEmail: user.email });
          updated++;
        }
      }
    }

    return { updated };
  },
});

export const fixConditionalFolderCanonicals = mutation({
  args: {},
  handler: async (ctx) => {
    const foldersToFix = ['clutter', 'conversation history'];
    let fixed = 0;

    const allFolders = await ctx.db.query('productivity_email_Folders').collect();

    for (const folder of allFolders) {
      const displayNameLower = folder.displayName.toLowerCase().trim();
      if (foldersToFix.includes(displayNameLower) && folder.canonicalFolder === 'system') {
        await ctx.db.patch(folder._id, { canonicalFolder: 'inbox' });
        fixed++;
      }
    }

    return { fixed, message: `Fixed ${fixed} folder(s)` };
  },
});

export const adminRefetchAllFolders = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('productivity_email_Accounts').collect();
    let accountsReset = 0;
    let foldersDeleted = 0;
    let messagesDeleted = 0;
    let cacheDeleted = 0;

    for (const account of accounts) {
      await ctx.db.patch(account._id, { initialSyncComplete: false });
      accountsReset++;

      const messages = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
        messagesDeleted++;
      }

      const folders = await ctx.db
        .query('productivity_email_Folders')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .collect();

      for (const folder of folders) {
        await ctx.db.delete(folder._id);
        foldersDeleted++;
      }
    }

    const cacheEntries = await ctx.db.query('productivity_email_BodyCache').collect();
    for (const entry of cacheEntries) {
      await ctx.db.delete(entry._id);
      cacheDeleted++;
    }

    return {
      accountsReset,
      foldersDeleted,
      messagesDeleted,
      cacheDeleted,
      message: `Full reset: ${accountsReset} accounts, ${foldersDeleted} folders, ${messagesDeleted} messages`,
    };
  },
});
