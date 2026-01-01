/**─────────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK EMAIL SYNC - Convex Functions                                 │
│  /convex/productivity/email/outlook.ts                                    │
│                                                                           │
│  OAuth token management + metadata sync from Microsoft Graph API          │
└───────────────────────────────────────────────────────────────────────────┘ */

import { v } from 'convex/values';
import { mutation, query, action } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
// Id type reserved for Phase 2 body processing
// import { Id } from '@/convex/_generated/dataModel';
// HTML normalizer functions - reserved for Phase 2 body processing
// import { normalizeEmailHtml, isHtmlContent } from './htmlNormalizer';

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
  // Conditional folders - sync them (map to INBOX so they're not excluded)
  // UI shows them only when they have messages
  'conversation history': CanonicalFolder.INBOX,
  clutter: CanonicalFolder.INBOX,
  // True system folders - never sync
  'sync issues': CanonicalFolder.SYSTEM,
  conflicts: CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
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
  // Unknown → INBOX (custom folders synced like inbox, not excluded)
  return CanonicalFolder.INBOX;
}

// Re-export to satisfy unused detection (Phase 2 will use this)
export const __outlookFolderMapper = _mapOutlookFolderToCanonical;

/**
 * Extracts canonical states from Outlook message properties.
 * Reserved for Phase 2 state synchronization.
 */
export function extractOutlookCanonicalStates(message: {
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
    providerVariant: v.optional(v.union(
      v.literal('outlook_personal'),
      v.literal('outlook_enterprise')
    )), // Personal vs Enterprise distinction
  },
  handler: async (ctx, args) => {
    // Get user from provided userId
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const microsoftEmail = args.emailAddress || user.email || 'unknown@outlook.com';

    // Check if Outlook account with THIS EMAIL already exists for this user
    // This allows multiple Outlook accounts per user (work + personal)
    const existingAccount = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('provider'), 'outlook'),
          q.eq(q.field('emailAddress'), microsoftEmail)
        )
      )
      .first();

    const now = Date.now();

    if (existingAccount) {
      // Update existing account (same email = reconnecting same account)
      await ctx.db.patch(existingAccount._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        tokenExpiresAt: args.expiresAt,
        providerVariant: args.providerVariant, // Update variant (may have changed if account type changed)
        status: 'active',
        lastSyncError: undefined,
        updatedAt: now,
      });
      console.log(`✅ Updated Outlook account ${existingAccount._id} (${microsoftEmail}) [${args.providerVariant}]`);
    } else {
      // Create new account (different email = new account)
      await ctx.db.insert('productivity_email_Accounts', {
        label: 'Outlook',
        emailAddress: microsoftEmail,
        ownerEmail: user.email, // For dashboard identification
        provider: 'outlook',
        providerVariant: args.providerVariant, // Personal vs Enterprise distinction
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
      console.log(`✅ Created new Outlook account for user ${user._id} (${microsoftEmail}) [${args.providerVariant}]`);
    }
  },
});

/**
 * Acquire sync lock for an account
 * Returns true if lock acquired, false if another sync is running
 */
export const acquireSyncLock = mutation({
  args: {
    userId: v.id('admin_users'),
    syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))),
    isBackground: v.optional(v.boolean()), // true = invisible, false = show spinner
  },
  handler: async (ctx, args): Promise<{ acquired: boolean; reason?: string }> => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { acquired: false, reason: 'User not found' };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { acquired: false, reason: 'Account not found' };

    const now = Date.now();
    const LOCK_TTL = 5 * 60 * 1000; // 5 minutes default

    // Check if lock is held and not expired
    if (account.syncStartedAt) {
      const lockAge = now - account.syncStartedAt;
      const ttl = account.syncLockTTL || LOCK_TTL;

      if (lockAge < ttl) {
        console.log(`🔒 Sync lock held (started ${Math.round(lockAge / 1000)}s ago)`);
        return { acquired: false, reason: `Sync already in progress (${Math.round(lockAge / 1000)}s ago)` };
      }
      console.log(`🔓 Stale lock released (${Math.round(lockAge / 1000)}s old)`);
    }

    // PHASE 1: Separate UI flags for user-initiated vs background
    // - isSyncing: User clicked refresh → show spinner, disable button
    // - isBackgroundPolling: Cron/background → invisible, no UI blocking
    const isBackground = args.isBackground ?? false;

    await ctx.db.patch(account._id, {
      syncStartedAt: now,
      syncLockTTL: LOCK_TTL,
      // MUST explicitly set false, not undefined (undefined leaves previous value)
      isSyncing: !isBackground,
      isBackgroundPolling: isBackground,
    });

    console.log(`🔒 Sync lock acquired (${isBackground ? 'isBackgroundPolling' : 'isSyncing'}=true)`);
    return { acquired: true };
  },
});

/**
 * Release sync lock after sync completes
 */
export const releaseSyncLock = mutation({
  args: {
    userId: v.id('admin_users'),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return;

    const now = Date.now();
    await ctx.db.patch(account._id, {
      syncStartedAt: undefined,       // Release lock
      isSyncing: false,               // User-initiated spinner off
      isBackgroundPolling: false,     // Background flag off
      lastSyncAt: args.success ? now : account.lastSyncAt,
      lastSyncError: args.error,
      updatedAt: now,
    });

    console.log(`🔓 Sync lock released (success: ${args.success})`);
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
      emailAddress: account.emailAddress, // CRITICAL: Needed for token refresh to prevent phantom accounts
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
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔒 SYNC INTEGRITY DOCTRINE (non-negotiable)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * A sync that does not complete fully MUST NOT persist progress markers.
 *
 * This applies to:
 *   - Delta tokens (pagination resume points)
 *   - "Last synced at" timestamps
 *   - Any cursor or offset that implies "everything before this is done"
 *
 * Rationale:
 *   Partial sync + saved progress marker = permanently truncated dataset.
 *   The system will resume from the marker and never recover missing history.
 *
 * Implementation:
 *   - On ANY page fetch failure: THROW (do not break/continue)
 *   - Delta tokens are saved ONLY after successful folder completion
 *   - Lock is released with success=false on any error
 *
 * This doctrine exists because silent partial success caused data loss.
 * Do not weaken this invariant for "convenience" or "retry later" logic.
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const syncOutlookMessages = action({
  args: {
    userId: v.id('admin_users'), // User ID to sync for
    syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))), // What folders to sync
    isBackground: v.optional(v.boolean()), // true = invisible (cron), false = show spinner (manual)
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageCount?: number; pagesProcessed?: number; error?: string; skipped?: boolean }> => {
    const syncMode = args.syncMode || 'full';
    const isBackground = args.isBackground ?? false;
    const lockResult = await ctx.runMutation(api.productivity.email.outlook.acquireSyncLock, {
      userId: args.userId,
      syncMode,
      isBackground,
    });

    if (!lockResult.acquired) {
      console.log(`⏭️ Sync skipped: ${lockResult.reason}`);
      return { success: true, skipped: true, error: lockResult.reason };
    }

    // Get tokens from database
    let tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });
    if (!tokens) {
      console.error('No Outlook tokens found');
      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
        userId: args.userId,
        success: false,
        error: 'Not connected to Outlook',
      });
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
          await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
            userId: args.userId,
            success: false,
            error: 'Token refresh failed',
          });
          return { success: false, error: 'Token refresh failed - please reconnect Outlook' };
        }

        const refreshData = await refreshResponse.json() as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        // Store new tokens - MUST pass emailAddress to prevent phantom account creation
        await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
          userId: args.userId,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || tokens.refreshToken,
          expiresAt: now + refreshData.expires_in * 1000,
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
          emailAddress: tokens.emailAddress, // CRITICAL: Prevents creating duplicate account with user.email fallback
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
        await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
          userId: args.userId,
          success: false,
          error: 'Token refresh error',
        });
        return { success: false, error: 'Token refresh error - please reconnect Outlook' };
      }
    }

    try {
      let totalMessages = 0;
      let pagesProcessed = 0;
      const BATCH_SIZE = 50; // Smaller batches to avoid Convex mutation size limits

      // Skip folder fetch if cached (background polling optimization)
      const FOLDER_CACHE_TTL = 60 * 60 * 1000; // 1 hour
      const accountInfo = await ctx.runQuery(api.productivity.email.outlookDiagnostics.getAccountFolderCacheStatus, {
        userId: args.userId,
      });
      const foldersCachedAt = accountInfo?.foldersCachedAt ?? 0;
      const folderCacheAge = Date.now() - foldersCachedAt;
      const shouldSkipFolderFetch = syncMode === 'inbox-only' && folderCacheAge < FOLDER_CACHE_TTL;

      if (shouldSkipFolderFetch) {
        console.log(`📁 Skipping folder fetch (cached ${Math.round(folderCacheAge / 1000)}s ago, mode=${syncMode})`);
      }

      // Fetch folder list (unless cached)
      const folderMap: Record<string, { displayName: string }> = {};
      const foldersToStore: Array<{
        externalFolderId: string;
        displayName: string;
        canonicalFolder: string;
        parentFolderId?: string;
        childFolderCount: number;
      }> = [];

      // PHASE 1: Skip folder fetch if cached (for background polling)
      if (!shouldSkipFolderFetch) {
      // Fetch top-level folders (includeHiddenFolders=true catches Clutter which is hidden)
      console.log('📁 Fetching Outlook folder list (including hidden)...');
      const foldersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/mailFolders?$select=id,displayName,childFolderCount&$top=100&includeHiddenFolders=true',
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (foldersResponse.ok) {
        const foldersData = (await foldersResponse.json()) as {
          value: Array<{ id: string; displayName: string; childFolderCount: number }>;
        };

        console.log(`📁 Found ${foldersData.value.length} top-level folders`);

        // Add top-level folders
        for (const folder of foldersData.value) {
          // Map displayName to canonical folder
          const canonicalFolder = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()] || CanonicalFolder.INBOX;
          folderMap[folder.id] = {
            displayName: folder.displayName,
          };
          foldersToStore.push({
            externalFolderId: folder.id,
            displayName: folder.displayName,
            canonicalFolder,
            parentFolderId: undefined,
            childFolderCount: folder.childFolderCount,
          });
          console.log(`📁 ${folder.displayName} → ${canonicalFolder}`);
        }

        // Fetch child folders RECURSIVELY (handles grandchildren like Inbox → Fyxer AI → 1: To respond)
        // ═══════════════════════════════════════════════════════════════════════════
        // RECURSIVE SUBFOLDER FETCH
        // ═══════════════════════════════════════════════════════════════════════════
        // Some Outlook add-ons (like Fyxer AI) create nested folder hierarchies:
        //   Inbox → Fyxer AI → 1: To respond, 2: FYI, etc.
        // We must recurse to catch all levels, not just direct children.
        // ═══════════════════════════════════════════════════════════════════════════

        async function fetchChildFoldersRecursive(
          parentId: string,
          parentDisplayName: string,
          parentCanonical: string,
          depth: number
        ): Promise<void> {
          console.log(`🔍 RECURSE depth=${depth}: Fetching children of "${parentDisplayName}"`);

          // Practical ceiling (1M) - accommodates anything Microsoft allows
          if (depth > 1000000) {
            console.log(`⚠️ Max folder depth reached for ${parentDisplayName}`);
            return;
          }

          // Guard for TypeScript - tokens was validated at function entry
          if (!tokens) return;

          const childUrl = `https://graph.microsoft.com/v1.0/me/mailFolders/${parentId}/childFolders?$select=id,displayName,childFolderCount&$top=100`;
          console.log(`🔍 Fetching: ${childUrl.substring(0, 80)}...`);

          const childResponse = await fetch(childUrl, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!childResponse.ok) {
            const errorText = await childResponse.text();
            console.warn(`⚠️ Failed to fetch children for ${parentDisplayName}: ${childResponse.status} - ${errorText.substring(0, 100)}`);
            return;
          }

          const childData = (await childResponse.json()) as {
            value: Array<{ id: string; displayName: string; childFolderCount: number }>;
          };

          console.log(`🔍 "${parentDisplayName}" has ${childData.value.length} children`);

          if (childData.value.length === 0) return;

          // Log EVERY child with its childFolderCount
          for (const child of childData.value) {
            console.log(`📁 ${'  '.repeat(depth)}├─ ${child.displayName} (hasChildren: ${child.childFolderCount > 0}, count: ${child.childFolderCount})`);
          }

          // Add child folders - inherit ancestor's canonical mapping
          for (const child of childData.value) {
            folderMap[child.id] = {
              displayName: parentDisplayName, // Use ancestor's name for canonical mapping
            };
            foldersToStore.push({
              externalFolderId: child.id,
              displayName: child.displayName,
              canonicalFolder: parentCanonical, // Inherit from ancestor
              parentFolderId: parentId,
              childFolderCount: child.childFolderCount || 0,
            });

            // RECURSE if this child has children
            if (child.childFolderCount > 0) {
              console.log(`🔍 "${child.displayName}" has ${child.childFolderCount} children - RECURSING...`);
              await fetchChildFoldersRecursive(
                child.id,
                child.displayName,
                parentCanonical, // Pass down the ancestor's canonical
                depth + 1
              );
            }
          }
        }

        // Start recursive fetch for all top-level folders with children
        const foldersWithChildren = foldersData.value.filter(f => f.childFolderCount > 0);
        console.log(`📁 ${foldersWithChildren.length} folders have children: ${foldersWithChildren.map(f => `${f.displayName}(${f.childFolderCount})`).join(', ')}`);

        for (const parentFolder of foldersWithChildren) {
          const parentCanonical = OUTLOOK_FOLDER_MAP[parentFolder.displayName.toLowerCase().trim()] || CanonicalFolder.INBOX;
          await fetchChildFoldersRecursive(
            parentFolder.id,
            parentFolder.displayName,
            parentCanonical,
            1 // depth starts at 1
          );
        }

        console.log(`📁 Total folders loaded: ${Object.keys(folderMap).length} (including subfolders)`);
        console.log(`📁 Folders to store (before dedup): ${foldersToStore.length}`);

        // ═══════════════════════════════════════════════════════════════════════════
        // DEDUPE: Keep first occurrence (top-level) if folder appears multiple times
        // ═══════════════════════════════════════════════════════════════════════════
        // A folder might be returned both at top-level AND as a child via recursion.
        // We keep the FIRST entry (top-level with parentFolderId=undefined) so it
        // appears in the custom section, not hidden under Inbox.
        // ═══════════════════════════════════════════════════════════════════════════
        const seenFolderIds = new Set<string>();
        const dedupedFolders = foldersToStore.filter(f => {
          if (seenFolderIds.has(f.externalFolderId)) {
            console.log(`📁 Dedup: Skipping duplicate ${f.displayName} (keeping first entry)`);
            return false;
          }
          seenFolderIds.add(f.externalFolderId);
          return true;
        });
        console.log(`📁 Folders to store (after dedup): ${dedupedFolders.length}`);

        // Store folders in database
        if (dedupedFolders.length > 0) {
          console.log('📁 Calling storeOutlookFolders mutation...');
          try {
            await ctx.runMutation(api.productivity.email.outlookStore.storeOutlookFolders, {
              userId: args.userId,
              folders: dedupedFolders,
            });
            console.log('📁 storeOutlookFolders completed successfully');

            // PHASE 1: Update folder cache timestamp
            await ctx.runMutation(api.productivity.email.outlook.updateFolderCacheTimestamp, {
              userId: args.userId,
            });
          } catch (mutationError) {
            console.error('❌ storeOutlookFolders FAILED:', mutationError);
            throw mutationError;
          }
        }
      } else {
        const errorText = await foldersResponse.text();
        console.warn(`⚠️ Could not fetch folders (${foldersResponse.status}): ${errorText}`);
      }
      } // End of !shouldSkipFolderFetch block

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 2: TWO-PHASE SYNC
      // ═══════════════════════════════════════════════════════════════════════
      //
      // Phase A (initialSyncComplete=false): Full history via /messages API
      // Phase B (initialSyncComplete=true): Incremental via /messages/delta API
      //
      // Delta API only returns recent activity (~50 messages per folder).
      // Initial sync MUST use standard /messages endpoint for full history.
      // ═══════════════════════════════════════════════════════════════════════

      // Get syncable folders (inbox-only for background, full for manual)
      // syncMode already defined at function entry (line 410)
      const syncableFolders = await ctx.runQuery(
        api.productivity.email.outlook.getSyncableFolders,
        { userId: args.userId, syncMode }
      );

      if (syncableFolders.length === 0) {
        console.log('⚠️ No syncable folders found - folders may not have been created yet');
        await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
          userId: args.userId,
          success: false,
          error: 'No syncable folders found',
        });
        return { success: false, error: 'No syncable folders found' };
      }

      // Check if initial sync is complete
      const syncStatus = await ctx.runQuery(
        api.productivity.email.outlookDiagnostics.getAccountInitialSyncStatus,
        { userId: args.userId }
      );

      const initialSyncComplete = syncStatus?.initialSyncComplete ?? false;

      console.log(`📁 Syncing ${syncableFolders.length} folders (initialSyncComplete: ${initialSyncComplete})`);
      console.log(`📁 Folders: ${syncableFolders.map(f => f.displayName).join(', ')}`);

      // Microsoft Graph message fields to request
      const MESSAGE_FIELDS = [
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
        'parentFolderId',
        'categories',
      ].join(',');

      if (!initialSyncComplete) {
        // ═══════════════════════════════════════════════════════════════════
        // PHASE A: INITIAL HISTORICAL SYNC
        // Uses /messages endpoint (NOT delta) to fetch ALL messages
        // ═══════════════════════════════════════════════════════════════════
        console.log('🅰️ PHASE A: Initial historical sync starting...');

        for (const folder of syncableFolders) {
          let folderMessages = 0;
          let folderPages = 0;

          // Get folder message count from Microsoft
          const countResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}?$select=totalItemCount`,
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          let expectedCount = 0;
          if (countResponse.ok) {
            const countData = await countResponse.json() as { totalItemCount?: number };
            expectedCount = countData.totalItemCount ?? 0;
            console.log(`📊 ${folder.displayName}: Microsoft says ${expectedCount} items`);
          }

          // Phase A: Use standard /messages endpoint with ordering
          // This returns ALL messages, not just recent changes
          let nextUrl: string | null =
            `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}/messages?` +
            new URLSearchParams({
              $select: MESSAGE_FIELDS,
              $orderby: 'receivedDateTime desc',
              $top: String(BATCH_SIZE),
            });

          console.log(`📥 Phase A: Full history sync for ${folder.displayName}`);

          // Track all message IDs we receive from Microsoft for stale cleanup
          const validMessageIds: string[] = [];

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
              console.error(`❌ Phase A sync error for ${folder.displayName}:`, errorText);
              throw new Error(`Phase A page fetch failed for ${folder.displayName}: ${response.status} - ${errorText.substring(0, 200)}`);
            }

            const data = (await response.json()) as {
              value: Array<{ id: string }>;
              '@odata.nextLink'?: string;
            };

            const messages = data.value;
            folderPages++;
            pagesProcessed++;

            // Collect message IDs for stale cleanup
            for (const msg of messages) {
              if (msg.id) validMessageIds.push(msg.id);
            }

            console.log(`📨 ${folder.displayName} page ${folderPages}: ${messages.length} messages (total so far: ${folderMessages + messages.length})`);

            if (messages.length > 0) {
              await ctx.runMutation(api.productivity.email.outlookStore.storeOutlookMessages, {
                userId: args.userId,
                messages,
                bodyStorageMap: {},
                folderMap,
              });

              folderMessages += messages.length;
              totalMessages += messages.length;
            }

            // Follow pagination
            if (data['@odata.nextLink']) {
              nextUrl = data['@odata.nextLink'];
            } else {
              nextUrl = null; // Done with this folder
            }

            // Safety valve: prevent infinite loops (500 pages = ~25,000 messages per folder)
            if (folderPages >= 500) {
              console.log(`⚠️ Reached 500 pages limit for ${folder.displayName}`);
              break;
            }
          }

          // Remove stale messages that are in our DB but not in Microsoft anymore
          await ctx.runMutation(api.productivity.email.outlookStore.removeStaleMessages, {
            userId: args.userId,
            folderId: folder.externalFolderId,
            validMessageIds,
          });

          console.log(`✅ ${folder.displayName}: Phase A SYNCED ${folderMessages}/${expectedCount} messages across ${folderPages} pages`);
        }

        // All folders synced successfully - mark initial sync complete
        await ctx.runMutation(api.productivity.email.outlookDiagnostics.markInitialSyncComplete, {
          userId: args.userId,
        });

        console.log(`✅ PHASE A COMPLETE: ${totalMessages} messages across ${pagesProcessed} pages`);
        console.log(`🎉 Initial sync complete - future syncs will use delta API`);

      } else {
        // ═══════════════════════════════════════════════════════════════════
        // PHASE B: INCREMENTAL DELTA SYNC
        // Uses /messages/delta endpoint to fetch only changes since last sync
        // PHASE 1 OPTIMIZATION: inbox-only mode means 1 folder, fast completion
        // ═══════════════════════════════════════════════════════════════════
        const startTime = Date.now();
        console.log(`🅱️ PHASE B: Incremental delta sync (${syncMode} mode, ${syncableFolders.length} folder(s))...`);

        for (const folder of syncableFolders) {
          const hasDelta = Boolean(folder.deltaToken && folder.deltaToken.length > 0);
          let folderMessages = 0;
          let folderPages = 0;

          // Determine starting URL
          let nextUrl: string | null;

          if (hasDelta) {
            // Use existing delta token
            console.log(`🔄 Delta sync for ${folder.displayName} (using stored deltaLink)`);
            nextUrl = folder.deltaToken as string;
          } else {
            // First delta sync for this folder - start fresh
            console.log(`📥 Initial delta for ${folder.displayName}`);
            nextUrl =
              `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}/messages/delta?` +
              new URLSearchParams({
                $select: MESSAGE_FIELDS,
                $top: String(BATCH_SIZE),
              });
          }

          // Paginate through delta results
          while (nextUrl) {
            const response: Response = await fetch(nextUrl, {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (!response.ok) {
              const errorText: string = await response.text();
              console.error(`❌ Delta sync error for ${folder.displayName}:`, errorText);

              if (response.status === 410 || errorText.includes('SyncStateNotFound')) {
                console.log(`🔄 Delta token expired for ${folder.displayName}, clearing...`);
                await ctx.runMutation(api.productivity.email.outlook.saveFolderDeltaToken, {
                  folderId: folder.externalFolderId,
                  deltaToken: '',
                });
              }

              throw new Error(`Delta page fetch failed for ${folder.displayName}: ${response.status} - ${errorText.substring(0, 200)}`);
            }

            const data = (await response.json()) as {
              value: unknown[];
              '@odata.nextLink'?: string;
              '@odata.deltaLink'?: string;
            };

            const messages: unknown[] = data.value;
            folderPages++;
            pagesProcessed++;

            console.log(`📨 ${folder.displayName} delta page ${folderPages}: ${messages.length} messages`);

            if (messages.length > 0) {
              await ctx.runMutation(api.productivity.email.outlookStore.storeOutlookMessages, {
                userId: args.userId,
                messages,
                bodyStorageMap: {},
                folderMap,
              });

              folderMessages += messages.length;
              totalMessages += messages.length;
            }

            // Check for next page or delta link
            if (data['@odata.nextLink']) {
              nextUrl = data['@odata.nextLink'];
            } else if (data['@odata.deltaLink']) {
              console.log(`💾 Storing deltaLink for ${folder.displayName}`);
              await ctx.runMutation(api.productivity.email.outlook.saveFolderDeltaToken, {
                folderId: folder.externalFolderId,
                deltaToken: data['@odata.deltaLink'],
              });
              nextUrl = null;
            } else {
              nextUrl = null;
            }

            // Safety valve
            if (folderPages >= 50) {
              console.log(`⚠️ Reached 50 pages limit for ${folder.displayName}`);
              break;
            }
          }

          console.log(`✅ ${folder.displayName}: Delta synced ${folderMessages} new messages across ${folderPages} pages`);
        }

        const elapsedMs = Date.now() - startTime;
        const statusEmoji = totalMessages === 0 ? '⚡' : '✅';
        console.log(`${statusEmoji} PHASE B COMPLETE: ${totalMessages} messages, ${pagesProcessed} pages, ${elapsedMs}ms (${syncMode})`);
      }

      // Release lock on success
      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
        userId: args.userId,
        success: true,
      });

      return { success: true, messageCount: totalMessages, pagesProcessed };
    } catch (error) {
      console.error('Outlook sync error:', error);

      // Release lock on error
      await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
        userId: args.userId,
        success: false,
        error: String(error),
      });

      return { success: false, error: String(error) };
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// PER-FOLDER DELTA SYNC HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get delta tokens for all folders (for a user's account)
 * Returns map of folderId → deltaToken
 */
export const getFolderDeltaTokens = query({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return null;

    // Get all folders for this account that have delta tokens
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const tokenMap: Record<string, string> = {};
    for (const folder of folders) {
      if (folder.deltaToken) {
        tokenMap[folder.externalFolderId] = folder.deltaToken;
      }
    }

    return tokenMap;
  },
});

/**
 * Save delta token for a specific folder
 */
export const saveFolderDeltaToken = mutation({
  args: {
    folderId: v.string(), // External folder ID
    deltaToken: v.string(),
  },
  handler: async (ctx, args) => {
    const folder = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_external_id', (q) => q.eq('externalFolderId', args.folderId))
      .first();

    if (!folder) {
      console.warn(`⚠️ Folder ${args.folderId} not found, cannot save delta token`);
      return;
    }

    await ctx.db.patch(folder._id, {
      deltaToken: args.deltaToken,
      deltaTokenUpdatedAt: Date.now(),
      updatedAt: Date.now(),
    });

    console.log(`💾 Saved delta token for folder ${folder.displayName}`);
  },
});

/**
 * Get folders that need delta sync (canonical folders we care about)
 *
 * syncMode:
 * - 'full': All folders (manual refresh, initial sync)
 * - 'inbox-only': Just inbox (background polling) - FAST, <2 seconds
 */
export const getSyncableFolders = query({
  args: {
    userId: v.id('admin_users'),
    syncMode: v.optional(v.union(v.literal('full'), v.literal('inbox-only'))),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return [];

    // Get all folders for this account
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    // Filter to canonical folders we want to sync
    // Sync ALL user folders, skip only system folders (Sync Issues, Conflicts, etc)
    const EXCLUDED_CANONICAL = ['system'];

    let filteredFolders = folders.filter((f) => !EXCLUDED_CANONICAL.includes(f.canonicalFolder));

    // PHASE 1 OPTIMIZATION: inbox-only mode for background polling
    // Background polls only sync inbox - full sync on manual refresh
    if (args.syncMode === 'inbox-only') {
      // Find the ROOT inbox folder (not subfolders mapped to inbox)
      // Root inbox has parentFolderId === null
      filteredFolders = filteredFolders.filter(
        (f) => f.canonicalFolder === 'inbox' && !f.parentFolderId
      );
      console.log(`📁 inbox-only mode: syncing ${filteredFolders.length} folder(s)`);
    }

    return filteredFolders.map((f) => ({
      externalFolderId: f.externalFolderId,
      displayName: f.displayName,
      canonicalFolder: f.canonicalFolder,
      deltaToken: f.deltaToken,
    }));
  },
});

/**
 * Update folder cache timestamp after successful folder fetch
 */
export const updateFolderCacheTimestamp = mutation({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return;

    await ctx.db.patch(account._id, {
      foldersCachedAt: Date.now(),
    });

    console.log(`📁 Folder cache timestamp updated for ${account.emailAddress}`);
  },
});

