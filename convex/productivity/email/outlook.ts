/**─────────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK EMAIL SYNC - Orchestrator                                     │
│  /convex/productivity/email/outlook.ts                                    │
│                                                                           │
│  Entry points + Convex bindings. Heavy lifting in helpers.                │
└───────────────────────────────────────────────────────────────────────────┘ */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import {
  CanonicalFolder,
  OUTLOOK_FOLDER_MAP,
  extractOutlookCanonicalStates,
  EXCLUDED_CANONICAL,
} from './outlookCanonical';
import {
  refreshAccessToken,
  fetchFoldersFromGraph,
  syncPhaseA,
  syncPhaseB,
  type SyncFolder,
} from './outlookHelpers';

// Re-export for backward compatibility
export { extractOutlookCanonicalStates };
export const __outlookFolderMapper = (d?: string, w?: string) =>
  OUTLOOK_FOLDER_MAP[(w || d || '').toLowerCase().trim()] || CanonicalFolder.INBOX;

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN STORAGE
// ═══════════════════════════════════════════════════════════════════════════

export const storeOutlookTokens = mutation({
  args: {
    userId: v.id('admin_users'),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
    emailAddress: v.optional(v.string()),
    providerVariant: v.optional(v.union(v.literal('outlook_personal'), v.literal('outlook_enterprise'))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const microsoftEmail = args.emailAddress || user.email || 'unknown@outlook.com';
    const existing = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.and(q.eq(q.field('provider'), 'outlook'), q.eq(q.field('emailAddress'), microsoftEmail)))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken, refreshToken: args.refreshToken, tokenExpiresAt: args.expiresAt,
        providerVariant: args.providerVariant, status: 'active', lastSyncError: undefined, updatedAt: now,
      });
    } else {
      await ctx.db.insert('productivity_email_Accounts', {
        label: 'Outlook', emailAddress: microsoftEmail, ownerEmail: user.email, provider: 'outlook',
        providerVariant: args.providerVariant, accessToken: args.accessToken, refreshToken: args.refreshToken,
        tokenExpiresAt: args.expiresAt, syncFrequency: 5 * 60 * 1000, syncEnabled: true, status: 'active',
        orgId: user.orgSlug || user._id, userId: user._id, createdAt: now, updatedAt: now, connectedAt: now,
      });
    }
  },
});

export const getOutlookTokens = query({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account?.accessToken) return null;
    return {
      accessToken: account.accessToken, refreshToken: account.refreshToken || '',
      expiresAt: account.tokenExpiresAt || 0, scope: '', emailAddress: account.emailAddress,
    };
  },
});

export const isOutlookConnected = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;
    const clerk = await ctx.db.query('admin_users_ClerkRegistry')
      .withIndex('by_external_id', (q) => q.eq('externalId', identity.subject)).first();
    if (!clerk) return false;
    const user = await ctx.db.get(clerk.userId);
    if (!user) return false;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    return !!(account?.accessToken && account.status === 'active');
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// SYNC LOCK
// ═══════════════════════════════════════════════════════════════════════════

export const acquireSyncLock = mutation({
  args: {
    userId: v.id('admin_users'),
    syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))),
    isBackground: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ acquired: boolean; reason?: string }> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { acquired: false, reason: 'User not found' };
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return { acquired: false, reason: 'Account not found' };

    const now = Date.now();
    const LOCK_TTL = 5 * 60 * 1000;
    if (account.syncStartedAt && now - account.syncStartedAt < (account.syncLockTTL || LOCK_TTL)) {
      return { acquired: false, reason: 'Sync already in progress' };
    }

    const isBackground = args.isBackground ?? false;
    await ctx.db.patch(account._id, {
      syncStartedAt: now, syncLockTTL: LOCK_TTL,
      isSyncing: !isBackground, isBackgroundPolling: isBackground,
    });
    return { acquired: true };
  },
});

export const releaseSyncLock = mutation({
  args: { userId: v.id('admin_users'), success: v.boolean(), error: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return;
    await ctx.db.patch(account._id, {
      syncStartedAt: undefined, isSyncing: false, isBackgroundPolling: false,
      lastSyncAt: args.success ? Date.now() : account.lastSyncAt, lastSyncError: args.error, updatedAt: Date.now(),
    });
  },
});

export const signalNewEmailsDetected = mutation({
  args: { userId: v.id('admin_users'), count: v.number() },
  handler: async (ctx, args) => {
    if (args.count <= 0) return;
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return;
    await ctx.db.patch(account._id, { newEmailsDetectedAt: Date.now() });
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

export const getSyncableFolders = query({
  args: { userId: v.id('admin_users'), syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))) },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return [];

    let folders = await ctx.db.query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id)).collect();
    folders = folders.filter((f) => !EXCLUDED_CANONICAL.includes(f.canonicalFolder));

    if (args.syncMode === 'inbox-only') {
      folders = folders.filter((f) => f.canonicalFolder === 'inbox' && !f.parentFolderId);
    }

    return folders.map((f) => ({
      externalFolderId: f.externalFolderId, displayName: f.displayName,
      canonicalFolder: f.canonicalFolder, deltaToken: f.deltaToken,
    }));
  },
});

export const saveFolderDeltaToken = mutation({
  args: { folderId: v.string(), deltaToken: v.string() },
  handler: async (ctx, args) => {
    const folder = await ctx.db.query('productivity_email_Folders')
      .withIndex('by_external_id', (q) => q.eq('externalFolderId', args.folderId)).first();
    if (!folder) return;
    await ctx.db.patch(folder._id, { deltaToken: args.deltaToken, deltaTokenUpdatedAt: Date.now(), updatedAt: Date.now() });
  },
});

export const getFolderDeltaTokens = query({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return null;
    const folders = await ctx.db.query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id)).collect();
    const map: Record<string, string> = {};
    for (const f of folders) if (f.deltaToken) map[f.externalFolderId] = f.deltaToken;
    return map;
  },
});

export const updateFolderCacheTimestamp = mutation({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;
    const account = await ctx.db.query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook')).first();
    if (!account) return;
    await ctx.db.patch(account._id, { foldersCachedAt: Date.now() });
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// SYNC ENTRY POINTS
// ═══════════════════════════════════════════════════════════════════════════

export const triggerOutlookSync = mutation({
  args: { userId: v.id('admin_users') },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, api.productivity.email.outlook.syncOutlookMessages, { userId: args.userId });
  },
});

/**
 * Main sync action - orchestrates folder fetch + message sync
 */
export const syncOutlookMessages = action({
  args: {
    userId: v.id('admin_users'),
    syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))),
    isBackground: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageCount?: number; error?: string; skipped?: boolean }> => {
    const syncMode = args.syncMode || 'full';
    const isBackground = args.isBackground ?? false;

    // Acquire lock
    const lock = await ctx.runMutation(api.productivity.email.outlook.acquireSyncLock, {
      userId: args.userId, syncMode, isBackground,
    });
    if (!lock.acquired) return { success: true, skipped: true, error: lock.reason };

    // Get tokens
    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, { userId: args.userId });
    if (!tokens) {
      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, { userId: args.userId, success: false, error: 'Not connected' });
      return { success: false, error: 'Not connected to Outlook' };
    }

    // Refresh if needed
    const now = Date.now();
    if (tokens.expiresAt < now + 5 * 60 * 1000 && tokens.refreshToken) {
      const refreshed = await refreshAccessToken(tokens.refreshToken, process.env.MICROSOFT_CLIENT_ID || '', process.env.MICROSOFT_CLIENT_SECRET || '');
      if (!refreshed) {
        await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, { userId: args.userId, success: false, error: 'Token refresh failed' });
        return { success: false, error: 'Token refresh failed' };
      }
      await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
        userId: args.userId, accessToken: refreshed.accessToken, refreshToken: refreshed.refreshToken,
        expiresAt: now + refreshed.expiresIn * 1000, scope: '', emailAddress: tokens.emailAddress,
      });
      tokens = { ...tokens, accessToken: refreshed.accessToken, expiresAt: now + refreshed.expiresIn * 1000 };
    }

    try {
      // Fetch folders if not cached
      const cacheStatus = await ctx.runQuery(api.productivity.email.outlookDiagnostics.getAccountFolderCacheStatus, { userId: args.userId });
      const shouldFetchFolders = syncMode !== 'inbox-only' || Date.now() - (cacheStatus?.foldersCachedAt ?? 0) > 60 * 60 * 1000;

      let folderMap: Record<string, { displayName: string }> = {};
      if (shouldFetchFolders) {
        const folderResult = await fetchFoldersFromGraph(tokens.accessToken);
        folderMap = folderResult.folderMap;
        if (folderResult.foldersToStore.length > 0) {
          await ctx.runMutation(api.productivity.email.outlookStore.storeOutlookFolders, {
            userId: args.userId, folders: folderResult.foldersToStore,
          });
          await ctx.runMutation(api.productivity.email.outlook.updateFolderCacheTimestamp, { userId: args.userId });
        }
      }

      // Get syncable folders
      const syncableFolders = await ctx.runQuery(api.productivity.email.outlook.getSyncableFolders, { userId: args.userId, syncMode });
      if (syncableFolders.length === 0) {
        await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, { userId: args.userId, success: false, error: 'No folders' });
        return { success: false, error: 'No syncable folders' };
      }

      // Sort: inbox first
      const sortedFolders: SyncFolder[] = [...syncableFolders].sort((a, b) => {
        const aInbox = a.canonicalFolder === 'inbox' || a.displayName.toLowerCase() === 'inbox';
        const bInbox = b.canonicalFolder === 'inbox' || b.displayName.toLowerCase() === 'inbox';
        return aInbox === bInbox ? 0 : aInbox ? -1 : 1;
      });

      // Check initial sync status
      const syncStatus = await ctx.runQuery(api.productivity.email.outlookDiagnostics.getAccountInitialSyncStatus, { userId: args.userId });
      const initialComplete = syncStatus?.initialSyncComplete ?? false;

      // Build callbacks
      const callbacks = {
        storeMessages: async (msgs: unknown[], fm: Record<string, { displayName: string }>) => {
          await ctx.runMutation(api.productivity.email.outlookStore.storeOutlookMessages, {
            userId: args.userId, messages: msgs, bodyStorageMap: {}, folderMap: fm,
          });
        },
        removeStaleMessages: async (folderId: string, validIds: string[]) => {
          await ctx.runMutation(api.productivity.email.outlookStore.removeStaleMessages, {
            userId: args.userId, folderId, validMessageIds: validIds,
          });
        },
        saveDeltaToken: async (folderId: string, token: string) => {
          await ctx.runMutation(api.productivity.email.outlook.saveFolderDeltaToken, { folderId, deltaToken: token });
        },
        signalNewEmails: async (count: number) => {
          await ctx.runMutation(api.productivity.email.outlook.signalNewEmailsDetected, { userId: args.userId, count });
        },
      };

      // Run sync phase
      let result: { totalMessages: number; pagesProcessed: number };
      if (!initialComplete) {
        result = await syncPhaseA(tokens.accessToken, sortedFolders, folderMap, 50, callbacks);
        await ctx.runMutation(api.productivity.email.outlookDiagnostics.markInitialSyncComplete, { userId: args.userId });
      } else {
        result = await syncPhaseB(tokens.accessToken, sortedFolders, folderMap, 50, callbacks);
      }

      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, { userId: args.userId, success: true });
      return { success: true, messageCount: result.totalMessages };
    } catch (error) {
      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, { userId: args.userId, success: false, error: String(error) });
      return { success: false, error: String(error) };
    }
  },
});
