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
        ownerEmail: user.email, // For dashboard identification
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
 * Acquire sync lock for an account
 * Returns true if lock acquired, false if another sync is running
 */
export const acquireSyncLock = mutation({
  args: { userId: v.id('admin_users') },
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

    // Acquire lock and set isSyncing for UI
    await ctx.db.patch(account._id, {
      syncStartedAt: now,
      syncLockTTL: LOCK_TTL,
      isSyncing: true,
    });

    console.log('🔒 Sync lock acquired, isSyncing=true');
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
      syncStartedAt: undefined, // Release lock
      isSyncing: false,         // UI spinner off
      lastSyncAt: args.success ? now : account.lastSyncAt,
      lastSyncError: args.error,
      updatedAt: now,
    });

    console.log(`🔓 Sync lock released, isSyncing=false (success: ${args.success})`);
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
  },
  handler: async (ctx, args): Promise<{ success: boolean; messageCount?: number; pagesProcessed?: number; error?: string; skipped?: boolean }> => {
    // ═══════════════════════════════════════════════════════════════════════
    // STEP 0: Acquire sync lock (prevents parallel syncs)
    // ═══════════════════════════════════════════════════════════════════════
    const lockResult = await ctx.runMutation(api.productivity.email.outlook.acquireSyncLock, {
      userId: args.userId,
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

      // ═══════════════════════════════════════════════════════════════════════
      // STEP 1: Fetch folder list and store hierarchy
      // ═══════════════════════════════════════════════════════════════════════
      const folderMap: Record<string, { displayName: string }> = {};
      const foldersToStore: Array<{
        externalFolderId: string;
        displayName: string;
        canonicalFolder: string;
        parentFolderId?: string;
        childFolderCount: number;
      }> = [];

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
            await ctx.runMutation(api.productivity.email.outlook.storeOutlookFolders, {
              userId: args.userId,
              folders: dedupedFolders,
            });
            console.log('📁 storeOutlookFolders completed successfully');
          } catch (mutationError) {
            console.error('❌ storeOutlookFolders FAILED:', mutationError);
            throw mutationError;
          }
        }
      } else {
        const errorText = await foldersResponse.text();
        console.warn(`⚠️ Could not fetch folders (${foldersResponse.status}): ${errorText}`);
      }

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

      // Get syncable folders
      const syncableFolders = await ctx.runQuery(
        api.productivity.email.outlook.getSyncableFolders,
        { userId: args.userId }
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
        api.productivity.email.outlook.getAccountInitialSyncStatus,
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
              await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
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
          await ctx.runMutation(api.productivity.email.outlook.removeStaleMessages, {
            userId: args.userId,
            folderId: folder.externalFolderId,
            validMessageIds,
          });

          console.log(`✅ ${folder.displayName}: Phase A SYNCED ${folderMessages}/${expectedCount} messages across ${folderPages} pages`);
        }

        // All folders synced successfully - mark initial sync complete
        await ctx.runMutation(api.productivity.email.outlook.markInitialSyncComplete, {
          userId: args.userId,
        });

        console.log(`✅ PHASE A COMPLETE: ${totalMessages} messages across ${pagesProcessed} pages`);
        console.log(`🎉 Initial sync complete - future syncs will use delta API`);

      } else {
        // ═══════════════════════════════════════════════════════════════════
        // PHASE B: INCREMENTAL DELTA SYNC
        // Uses /messages/delta endpoint to fetch only changes since last sync
        // ═══════════════════════════════════════════════════════════════════
        console.log('🅱️ PHASE B: Incremental delta sync starting...');

        for (const folder of syncableFolders) {
          const hasDelta = Boolean(folder.deltaToken && folder.deltaToken.length > 0);
          let folderMessages = 0;
          let folderPages = 0;

          // Track valid message IDs for stale cleanup (only for fresh delta)
          const validMessageIds: string[] = [];

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

            // Collect message IDs for stale cleanup (only for fresh delta)
            if (!hasDelta) {
              for (const msg of messages) {
                const m = msg as { id?: string; '@removed'?: unknown };
                if (m.id && !m['@removed']) {
                  validMessageIds.push(m.id);
                }
              }
            }

            if (messages.length > 0) {
              await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
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

          // For fresh delta (no existing token), clean up stale messages
          // This handles folders added after initial sync completed
          if (!hasDelta) {
            await ctx.runMutation(api.productivity.email.outlook.removeStaleMessages, {
              userId: args.userId,
              folderId: folder.externalFolderId,
              validMessageIds,
            });
          }

          console.log(`✅ ${folder.displayName}: Delta synced ${folderMessages} new messages across ${folderPages} pages`);
        }

        console.log(`✅ PHASE B COMPLETE: ${totalMessages} new messages across ${pagesProcessed} pages`);
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
    folderMap: v.optional(v.record(v.string(), v.object({
      displayName: v.string(),
    }))), // folderId → folder info
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
    let messagesDeleted = 0;
    let foldersMigrated = 0;
    const folderDistribution: Record<string, number> = {};
    const now = Date.now();

    // Store each message individually
    console.log(`📧 Processing ${args.messages.length} messages for account ${account._id}`);

    for (const message of args.messages) {
      // ═══════════════════════════════════════════════════════════════════════
      // HANDLE DELETIONS: Microsoft delta API sends @removed for deleted items
      // ═══════════════════════════════════════════════════════════════════════
      if (message['@removed']) {
        const existing = await ctx.db
          .query('productivity_email_Index')
          .withIndex('by_external_message_id', (q) =>
            q.eq('externalMessageId', message.id)
          )
          .filter((q) => q.eq(q.field('accountId'), account._id))
          .first();

        if (existing) {
          // Delete associated body cache
          const cacheEntry = await ctx.db
            .query('productivity_email_BodyCache')
            .withIndex('by_message', (q) => q.eq('messageId', message.id))
            .first();
          if (cacheEntry) {
            await ctx.storage.delete(cacheEntry.storageId);
            await ctx.db.delete(cacheEntry._id);
          }

          // Delete the message
          await ctx.db.delete(existing._id);
          messagesDeleted++;
        }
        continue;
      }

      // Check if message already exists FOR THIS ACCOUNT
      // CRITICAL: Must filter by accountId to avoid cross-account collision
      const existing = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_external_message_id', (q) =>
          q.eq('externalMessageId', message.id)
        )
        .filter((q) => q.eq(q.field('accountId'), account._id))
        .first();

      // DIAGNOSTIC: Log why message is skipped or stored
      console.log(`📧 Message ${message.id?.substring(0, 30)}... existing=${!!existing} currentAccount=${account._id}`);

      if (existing) {
        // ─────────────────────────────────────────────────────────────────────
        // CRITICAL: Delete orphaned blob that was pre-stored in the action
        // Without this, every sync creates duplicate blobs for existing emails!
        // ─────────────────────────────────────────────────────────────────────
        const orphanedStorageId = args.bodyStorageMap?.[message.id];
        if (orphanedStorageId) {
          await ctx.storage.delete(orphanedStorageId as Id<'_storage'>);
        }

        // Update folder info for existing messages (migration path)
        if (message.parentFolderId && args.folderMap?.[message.parentFolderId]) {
          const folder = args.folderMap[message.parentFolderId];
          const mapped = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()];

          if (mapped && existing.canonicalFolder !== mapped) {
            await ctx.db.patch(existing._id, {
              canonicalFolder: mapped,
              providerFolderId: message.parentFolderId,
              providerFolderName: folder.displayName,
              updatedAt: now,
            });
            foldersMigrated++;
          } else if (!existing.providerFolderId && message.parentFolderId) {
            // Backfill providerFolderId for existing messages that don't have it
            await ctx.db.patch(existing._id, {
              providerFolderId: message.parentFolderId,
              providerFolderName: folder.displayName,
              updatedAt: now,
            });
            foldersMigrated++;
          }
        }
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

      // Determine canonical folder from parentFolderId using folder map
      let canonicalFolder: CanonicalFolderType = CanonicalFolder.INBOX; // Default
      let providerFolderName: string | undefined;

      if (message.parentFolderId && args.folderMap?.[message.parentFolderId]) {
        const folder = args.folderMap[message.parentFolderId];
        providerFolderName = folder.displayName;

        // Map using displayName
        const mapped = OUTLOOK_FOLDER_MAP[folder.displayName.toLowerCase().trim()];

        if (mapped) {
          canonicalFolder = mapped;
        }
      } else if (message.isDraft) {
        // Fallback for drafts if folder lookup fails
        canonicalFolder = CanonicalFolder.DRAFTS;
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
        providerFolderName,
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

      // Track folder distribution for new messages
      folderDistribution[canonicalFolder] = (folderDistribution[canonicalFolder] || 0) + 1;
    }

    // Log summary with folder stats
    if (foldersMigrated > 0) {
      console.log(`🔄 Migrated ${foldersMigrated} existing messages to correct folders`);
    }
    if (messagesDeleted > 0) {
      console.log(`🗑️ Removed ${messagesDeleted} deleted messages from our DB`);
    }
    if (messagesStored > 0) {
      const distribution = Object.entries(folderDistribution)
        .map(([folder, count]) => `${folder}:${count}`)
        .join(', ');
      console.log(`✅ Stored ${messagesStored} messages (${distribution})`);
    } else if (messagesDeleted === 0) {
      console.log(`✅ No new messages to store`);
    }

    return { messagesStored, messagesDeleted, foldersMigrated };
  },
});

/**
 * Remove stale messages that no longer exist in Microsoft
 *
 * Called after Phase A sync completes for a folder.
 * Compares our DB messages with the IDs we received from Microsoft,
 * and deletes any messages we have that weren't in the sync.
 */
export const removeStaleMessages = mutation({
  args: {
    userId: v.id('admin_users'),
    folderId: v.string(), // External folder ID
    validMessageIds: v.array(v.string()), // All message IDs we received from Microsoft
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    // Get all messages we have for this folder
    const ourMessages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .filter((q) => q.eq(q.field('providerFolderId'), args.folderId))
      .collect();

    // Create set for O(1) lookup
    const validSet = new Set(args.validMessageIds);
    let deleted = 0;

    for (const message of ourMessages) {
      if (!validSet.has(message.externalMessageId)) {
        // This message is in our DB but not in Microsoft - it was deleted
        // Delete associated body cache first
        const cacheEntry = await ctx.db
          .query('productivity_email_BodyCache')
          .withIndex('by_message', (q) => q.eq('messageId', message.externalMessageId))
          .first();
        if (cacheEntry) {
          await ctx.storage.delete(cacheEntry.storageId);
          await ctx.db.delete(cacheEntry._id);
        }

        await ctx.db.delete(message._id);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`🗑️ Removed ${deleted} stale messages from folder ${args.folderId.substring(0, 20)}...`);
    }

    return { deleted };
  },
});

/**
 * Store Outlook folder hierarchy
 *
 * Upserts folder records to maintain hierarchy for UI display.
 * Called during sync to keep folder structure up-to-date.
 */
export const storeOutlookFolders = mutation({
  args: {
    userId: v.id('admin_users'),
    folders: v.array(v.object({
      externalFolderId: v.string(),
      displayName: v.string(),
      canonicalFolder: v.string(),
      parentFolderId: v.optional(v.string()),
      childFolderCount: v.number(),
    })),
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

    const now = Date.now();
    let created = 0;
    let updated = 0;

    for (const folder of args.folders) {
      // Check if folder already exists FOR THIS ACCOUNT
      const existing = await ctx.db
        .query('productivity_email_Folders')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .filter((q) => q.eq(q.field('externalFolderId'), folder.externalFolderId))
        .first();

      if (existing) {
        // Update existing folder - CLEAR deltaToken to force fresh sync
        // NOTE: Must delete field separately - patch(undefined) doesn't clear!
        await ctx.db.patch(existing._id, {
          displayName: folder.displayName,
          canonicalFolder: folder.canonicalFolder,
          parentFolderId: folder.parentFolderId,
          childFolderCount: folder.childFolderCount,
          updatedAt: now,
        });
        // Explicitly clear deltaToken by patching with empty string then undefined
        // Convex requires this two-step approach for optional fields
        if (existing.deltaToken) {
          await ctx.db.patch(existing._id, { deltaToken: '' });
        }
        updated++;
        console.log(`📁 Cleared deltaToken for ${folder.displayName}`);
      } else {
        // Create new folder
        await ctx.db.insert('productivity_email_Folders', {
          externalFolderId: folder.externalFolderId,
          displayName: folder.displayName,
          canonicalFolder: folder.canonicalFolder,
          parentFolderId: folder.parentFolderId,
          childFolderCount: folder.childFolderCount,
          accountId: account._id,
          provider: 'outlook',
          createdAt: now,
          updatedAt: now,
        });
        created++;
      }
    }

    console.log(`📁 Folders stored: ${created} created, ${updated} updated`);
    return { created, updated };
  },
});

/**
 * Disconnect Outlook account
 * Clears OAuth tokens, cascades body cache deletion, marks account as disconnected
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

    // ─────────────────────────────────────────────────────────────────────────
    // CASCADE DELETE: Full cleanup of all email data for this account
    // ─────────────────────────────────────────────────────────────────────────

    // 1. Delete body cache entries (with storage blobs)
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

    // 2. Get all messages for this account (need IDs for AssetReference cleanup)
    const messages = await ctx.db
      .query('productivity_email_Index')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    // 3. Delete AssetReferences for these messages and track which assets to check
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

    // 4. Clean up orphaned Assets (referenceCount = 0) and their storage blobs
    let assetsDeleted = 0;
    let storageBlobsDeleted = 0;

    for (const assetIdStr of assetIdsToCheck) {
      const assetId = assetIdStr as Id<'productivity_email_Assets'>;
      const asset = await ctx.db.get(assetId);
      if (!asset) continue;

      // Check if asset still has references
      const remainingRefs = await ctx.db
        .query('productivity_email_AssetReferences')
        .withIndex('by_asset', (q) => q.eq('assetId', assetId))
        .first();

      if (!remainingRefs) {
        // No more references - delete the asset and its storage blob
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

    // 6. Delete all folders for this account
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let foldersDeleted = 0;
    for (const folder of folders) {
      await ctx.db.delete(folder._id);
      foldersDeleted++;
    }

    // 7. Delete webhook subscriptions for this account
    const webhooks = await ctx.db
      .query('productivity_email_WebhookSubscriptions')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let webhooksDeleted = 0;
    for (const webhook of webhooks) {
      await ctx.db.delete(webhook._id);
      webhooksDeleted++;
    }

    // 8. GC SWEEP: Delete ALL orphaned assets (assets with no references anywhere)
    // This catches assets that were created without proper AssetReference linking
    const allAssets = await ctx.db.query('productivity_email_Assets').collect();
    let gcAssetsDeleted = 0;
    let gcBlobsDeleted = 0;

    for (const asset of allAssets) {
      // Check if this asset has ANY references left
      const hasRefs = await ctx.db
        .query('productivity_email_AssetReferences')
        .withIndex('by_asset', (q) => q.eq('assetId', asset._id))
        .first();

      if (!hasRefs) {
        // Orphan - delete it and its storage blob
        if (asset.storageId) {
          await ctx.storage.delete(asset.storageId);
          gcBlobsDeleted++;
        }
        await ctx.db.delete(asset._id);
        gcAssetsDeleted++;
      }
    }

    console.log(`🗑️ Cascade deleted: ${messagesDeleted} messages, ${assetRefsDeleted} asset refs, ${assetsDeleted} assets, ${storageBlobsDeleted} blobs, ${foldersDeleted} folders, ${cacheBodiesDeleted} cache entries, ${webhooksDeleted} webhooks`);
    console.log(`🧹 GC sweep: ${gcAssetsDeleted} orphaned assets, ${gcBlobsDeleted} storage blobs`);

    // 9. Delete the account itself (not just disconnect)
    await ctx.db.delete(args.accountId);

    console.log(`✅ Fully disconnected and cleaned up Outlook account ${account.emailAddress}`);
    return {
      success: true,
      messagesDeleted,
      assetRefsDeleted,
      assetsDeleted,
      storageBlobsDeleted,
      foldersDeleted,
      cacheBodiesDeleted,
      webhooksDeleted
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// DELETE / MOVE TO TRASH
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Move a message to trash (local Convex update)
 * Called after the Outlook API move succeeds
 */
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

    // Update the message's canonical folder to trash
    // Note: Threads are derived dynamically from messages, so updating the message
    // is all that's needed - the thread will reflect this change automatically
    await ctx.db.patch(args.messageId, {
      canonicalFolder: 'trash',
    });

    console.log(`🗑️ Moved message ${args.messageId} to trash`);
    return { success: true };
  },
});

/**
 * Delete message - moves to trash on Outlook server, then updates Convex
 */
export const deleteOutlookMessage = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get the message to find its external ID
    const message = await ctx.runQuery(api.productivity.email.outlook.getMessageById, {
      userId: args.userId,
      messageId: args.messageId,
    });

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Get user's Outlook tokens
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) {
      return { success: false, error: 'No Outlook access token' };
    }

    try {
      // Call Microsoft Graph API to move message to deleted items
      // POST /me/messages/{id}/move with body { destinationId: "deleteditems" }
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}/move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destinationId: 'deleteditems',
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to move message to trash:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      // Update local Convex state
      await ctx.runMutation(api.productivity.email.outlook.moveMessageToTrash, {
        userId: args.userId,
        messageId: args.messageId,
      });

      console.log(`✅ Deleted message ${message.externalMessageId} (moved to trash)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Delete message error:', error);
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Get a single message by Convex ID
 */
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
// ARCHIVE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Move a message to archive (local Convex update)
 * Called after the Outlook API move succeeds
 */
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

    await ctx.db.patch(args.messageId, {
      canonicalFolder: 'archive',
    });

    console.log(`📁 Moved message ${args.messageId} to archive`);
    return { success: true };
  },
});

/**
 * Archive message - moves to archive on Outlook server, then updates Convex
 */
export const archiveOutlookMessage = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    // Get the message to find its external ID
    const message = await ctx.runQuery(api.productivity.email.outlook.getMessageById, {
      userId: args.userId,
      messageId: args.messageId,
    });

    if (!message) {
      return { success: false, error: 'Message not found' };
    }

    // Get user's Outlook tokens
    const tokens = await ctx.runQuery(api.productivity.email.outlook.getOutlookTokens, {
      userId: args.userId,
    });

    if (!tokens?.accessToken) {
      return { success: false, error: 'No Outlook access token' };
    }

    try {
      // Call Microsoft Graph API to move message to archive
      // POST /me/messages/{id}/move with body { destinationId: "archive" }
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/messages/${message.externalMessageId}/move`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            destinationId: 'archive',
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to archive message:', errorText);
        return { success: false, error: `Outlook API error: ${response.status}` };
      }

      // Update local Convex state
      await ctx.runMutation(api.productivity.email.outlook.moveMessageToArchive, {
        userId: args.userId,
        messageId: args.messageId,
      });

      console.log(`✅ Archived message ${message.externalMessageId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Archive message error:', error);
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
 */
export const getSyncableFolders = query({
  args: {
    userId: v.id('admin_users'),
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

    return folders
      .filter((f) => !EXCLUDED_CANONICAL.includes(f.canonicalFolder))
      .map((f) => ({
        externalFolderId: f.externalFolderId,
        displayName: f.displayName,
        canonicalFolder: f.canonicalFolder,
        deltaToken: f.deltaToken,
      }));
  },
});

/**
 * Backfill ownerEmail for existing accounts (one-time migration)
 */
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

    console.log(`✅ Backfilled ownerEmail for ${updated} accounts`);
    return { updated };
  },
});

/**
 * Reset sync state - clears all delta tokens to force full resync
 * Use when initial sync was incomplete or corrupted
 */
export const resetSyncState = mutation({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { success: false, error: 'User not found' };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { success: false, error: 'No Outlook account found' };

    // Clear delta tokens from all folders
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    let cleared = 0;
    for (const folder of folders) {
      if (folder.deltaToken) {
        await ctx.db.patch(folder._id, {
          deltaToken: undefined,
          deltaTokenUpdatedAt: undefined,
        });
        cleared++;
      }
    }

    // Clear sync lock if stuck
    await ctx.db.patch(account._id, {
      syncStartedAt: undefined,
      lastSyncError: undefined,
    });

    console.log(`🔄 Reset sync state: cleared ${cleared} delta tokens for ${account.emailAddress}`);
    return { success: true, tokensCleared: cleared };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// TWO-PHASE SYNC HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get account's initial sync status
 *
 * Used to route between Phase A (full history) and Phase B (delta incremental)
 */
export const getAccountInitialSyncStatus = query({
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

    return {
      accountId: account._id,
      initialSyncComplete: account.initialSyncComplete ?? false,
    };
  },
});

/**
 * Reset initial sync flag to force Phase A (full history) to run again
 *
 * Use when:
 * - Initial sync missed some folders (e.g., deeply nested subfolders)
 * - Need to re-sync all messages from scratch
 * - Testing changes to Phase A sync logic
 */
export const resetInitialSyncFlag = mutation({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    // Reset the flag - next sync will run Phase A again
    await ctx.db.patch(account._id, {
      initialSyncComplete: false,
      updatedAt: Date.now(),
    });

    // Also clear all folder delta tokens so Phase A starts fresh
    const folders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    for (const folder of folders) {
      if (folder.deltaToken) {
        await ctx.db.patch(folder._id, {
          deltaToken: undefined,
          deltaTokenUpdatedAt: undefined,
        });
      }
    }

    console.log(`🔄 Reset initialSyncComplete for ${account.emailAddress} - next sync will run Phase A`);
    return { success: true, foldersCleared: folders.length };
  },
});

/**
 * DIAGNOSTIC: List all folders and their sync state
 *
 * Returns every folder with its canonical mapping and sync readiness.
 * Use this to debug why certain folders aren't being synced.
 */
export const debugListAllFolders = query({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { error: 'User not found' };

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { error: 'No Outlook account found' };

    // Get ALL folders
    const allFolders = await ctx.db
      .query('productivity_email_Folders')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    // Excluded canonical folders
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

/**
 * One-time fix: Update Clutter/Conversation History folders from SYSTEM to INBOX canonical
 * This allows them to sync messages.
 */
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
        console.log(`✅ Fixed ${folder.displayName}: system → inbox`);
        fixed++;
      }
    }

    return { fixed, message: `Fixed ${fixed} folder(s)` };
  },
});

/**
 * Emergency: Reset stuck isSyncing flag on all accounts
 */
export const resetStuckSync = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('productivity_email_Accounts').collect();
    let reset = 0;

    for (const account of accounts) {
      if (account.isSyncing) {
        await ctx.db.patch(account._id, { isSyncing: false });
        console.log(`✅ Reset isSyncing for ${account.emailAddress}`);
        reset++;
      }
    }

    return { reset, message: `Reset ${reset} account(s)` };
  },
});

/**
 * Admin: Force full refetch - deletes folders, messages, and body cache
 * Use this to fix stale data or when folder fetching parameters change.
 */
export const adminRefetchAllFolders = mutation({
  args: {},
  handler: async (ctx) => {
    const accounts = await ctx.db.query('productivity_email_Accounts').collect();
    let accountsReset = 0;
    let foldersDeleted = 0;
    let messagesDeleted = 0;
    let cacheDeleted = 0;

    for (const account of accounts) {
      // Reset initial sync flag so folders get refetched
      await ctx.db.patch(account._id, { initialSyncComplete: false });
      accountsReset++;

      // Delete all messages for this account (table is productivity_email_Index)
      const messages = await ctx.db
        .query('productivity_email_Index')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
        messagesDeleted++;
      }

      // Delete all folders for this account
      const folders = await ctx.db
        .query('productivity_email_Folders')
        .withIndex('by_account', (q) => q.eq('accountId', account._id))
        .collect();

      for (const folder of folders) {
        await ctx.db.delete(folder._id);
        foldersDeleted++;
      }

      console.log(`✅ Reset ${account.emailAddress}: ${folders.length} folders, ${messages.length} messages`);
    }

    // Delete all body cache entries (they reference old message IDs)
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
      message: `Full reset: ${accountsReset} accounts, ${foldersDeleted} folders, ${messagesDeleted} messages, ${cacheDeleted} cache entries`,
    };
  },
});

/**
 * Mark initial historical sync as complete
 *
 * Called ONLY after Phase A (full /messages sync) completes successfully.
 * After this, all subsequent syncs use Phase B (delta API).
 *
 * DOCTRINE: This flag must NEVER be set until all folders are fully synced.
 */
export const markInitialSyncComplete = mutation({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error('User not found');

    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) throw new Error('Outlook account not found');

    await ctx.db.patch(account._id, {
      initialSyncComplete: true,
      updatedAt: Date.now(),
    });

    console.log(`✅ Initial sync marked complete for ${account.emailAddress}`);
    return { success: true };
  },
});
