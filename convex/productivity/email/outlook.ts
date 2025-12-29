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
  // System folders
  'conversation history': CanonicalFolder.SYSTEM,
  'sync issues': CanonicalFolder.SYSTEM,
  conflicts: CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
  clutter: CanonicalFolder.SYSTEM,
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

      // Fetch top-level folders
      console.log('📁 Fetching Outlook folder list...');
      const foldersResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/mailFolders?$select=id,displayName,childFolderCount&$top=100',
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

        // Fetch child folders for folders that have children (e.g., Inbox subfolders)
        const foldersWithChildren = foldersData.value.filter(f => f.childFolderCount > 0);
        console.log(`📁 ${foldersWithChildren.length} folders have children: ${foldersWithChildren.map(f => `${f.displayName}(${f.childFolderCount})`).join(', ')}`);

        for (const parentFolder of foldersWithChildren) {
          const childResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/mailFolders/${parentFolder.id}/childFolders?$select=id,displayName,childFolderCount&$top=100`,
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (childResponse.ok) {
            const childData = (await childResponse.json()) as {
              value: Array<{ id: string; displayName: string; childFolderCount: number }>;
            };

            console.log(`📁 ${parentFolder.displayName} subfolders: ${childData.value.map(c => c.displayName).join(', ')}`);

            // Parent's canonical folder (for inheritance)
            const parentCanonical = OUTLOOK_FOLDER_MAP[parentFolder.displayName.toLowerCase().trim()] || CanonicalFolder.INBOX;

            // Add child folders - inherit parent's canonical mapping (subfolders of Inbox are still "inbox")
            for (const child of childData.value) {
              folderMap[child.id] = {
                displayName: parentFolder.displayName, // Use parent's name for canonical mapping
              };
              foldersToStore.push({
                externalFolderId: child.id,
                displayName: child.displayName,
                canonicalFolder: parentCanonical, // Inherit from parent
                parentFolderId: parentFolder.id,
                childFolderCount: child.childFolderCount || 0,
              });
            }
          } else {
            console.warn(`⚠️ Failed to fetch children for ${parentFolder.displayName}: ${childResponse.status}`);
          }
        }

        console.log(`📁 Total folders loaded: ${Object.keys(folderMap).length} (including subfolders)`);
        console.log(`📁 Folders to store: ${foldersToStore.length}`);

        // Store folders in database
        if (foldersToStore.length > 0) {
          console.log('📁 Calling storeOutlookFolders mutation...');
          try {
            await ctx.runMutation(api.productivity.email.outlook.storeOutlookFolders, {
              userId: args.userId,
              folders: foldersToStore,
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
      // STEP 2: Per-folder delta sync (incremental updates)
      // ═══════════════════════════════════════════════════════════════════════

      // Get syncable folders
      const syncableFolders = await ctx.runQuery(
        api.productivity.email.outlook.getSyncableFolders,
        { userId: args.userId }
      );

      // SURGICAL TEST #3 — count folders that qualify for sync
      console.log('📁 FOLDERS ELIGIBLE FOR SYNC', JSON.stringify({
        syncableFolders: syncableFolders.length,
        folderNames: syncableFolders.map(f => f.displayName),
      }));

      if (syncableFolders.length === 0) {
        console.log('⚠️ No syncable folders found - folders may not have been created yet');
        // Release lock and return early
        await ctx.runMutation(api.productivity.email.outlook.releaseSyncLock, {
          userId: args.userId,
          success: false,
          error: 'No syncable folders found',
        });
        return { success: false, error: 'No syncable folders found' };
      }

      console.log(`📁 Syncing ${syncableFolders.length} folders: ${syncableFolders.map(f => f.displayName).join(', ')}`);

      // Microsoft Graph message fields to request
      // NOTE: 'body' excluded - bodies fetched on-demand via bodyCache.getEmailBody
      // This prevents 1 storage blob per message during sync
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
        'bodyPreview', // Used for snippet display in list view
        'inferenceClassification',
        'flag',
        'parentFolderId',
        'categories',
      ].join(',');

      // SURGICAL TEST #1 — confirm message sync loop is entered
      console.log('🟢 ABOUT TO SYNC MESSAGES', JSON.stringify({
        foldersToSync: syncableFolders.map(f => ({
          name: f.displayName,
          id: f.externalFolderId,
          canonical: f.canonicalFolder,
          hasDelta: Boolean(f.deltaToken && f.deltaToken.length > 0),
        })),
      }));

      // Sync each folder using delta
      for (const folder of syncableFolders) {
        // SURGICAL TEST #2 — confirm delta state for this folder
        const hasDelta = Boolean(folder.deltaToken && folder.deltaToken.length > 0);
        console.log('🔍 DELTA STATE', JSON.stringify({
          folder: folder.displayName,
          deltaToken: folder.deltaToken ? `${folder.deltaToken.substring(0, 50)}...` : null,
          hasDelta,
        }));
        let folderMessages = 0;
        let folderPages = 0;

        // DIAGNOSTIC: Get folder message count from Microsoft
        const countResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/mailFolders/${folder.externalFolderId}?$select=totalItemCount`,
          {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        if (countResponse.ok) {
          const countData = await countResponse.json() as { totalItemCount?: number };
          console.log(`📊 ${folder.displayName}: Microsoft says ${countData.totalItemCount ?? 'unknown'} items`);
        }

        // Determine starting URL based on whether we have a delta token
        let nextUrl: string | null;

        // CRITICAL: Only treat as delta if token exists AND is non-empty
        const validDeltaToken = folder.deltaToken && folder.deltaToken.length > 0;

        if (validDeltaToken) {
          // Incremental sync: use existing delta token
          console.log(`🔄 Delta sync for ${folder.displayName} (using stored deltaLink)`);
          // We've validated validDeltaToken is truthy, so deltaToken exists and is non-empty
          nextUrl = folder.deltaToken as string;
        } else {
          // Initial sync: start fresh delta query for this folder
          console.log(`📥 Initial delta sync for ${folder.displayName}`);
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

            // If delta token is invalid/expired, clear it and retry with full sync
            if (response.status === 410 || errorText.includes('SyncStateNotFound')) {
              console.log(`🔄 Delta token expired for ${folder.displayName}, clearing...`);
              await ctx.runMutation(api.productivity.email.outlook.saveFolderDeltaToken, {
                folderId: folder.externalFolderId,
                deltaToken: '', // Clear the token
              });
            }

            // Skip this folder but continue with others
            break;
          }

          const data = (await response.json()) as {
            value: unknown[];
            '@odata.nextLink'?: string;
            '@odata.deltaLink'?: string;
          };

          const messages: unknown[] = data.value;
          folderPages++;
          pagesProcessed++;

          console.log(`📨 ${folder.displayName} page ${folderPages}: ${messages.length} messages`);

          if (messages.length > 0) {
            // Store messages (bodies fetched on-demand via bodyCache.getEmailBody)
            await ctx.runMutation(api.productivity.email.outlook.storeOutlookMessages, {
              userId: args.userId,
              messages,
              bodyStorageMap: {}, // No bodies stored during sync - fetched on-demand
              folderMap,
            });

            folderMessages += messages.length;
            totalMessages += messages.length;
          }

          // Check for next page or delta link
          if (data['@odata.nextLink']) {
            // More pages to fetch
            nextUrl = data['@odata.nextLink'];
          } else if (data['@odata.deltaLink']) {
            // Got deltaLink - save it for next sync
            console.log(`💾 Storing deltaLink for ${folder.displayName}`);
            await ctx.runMutation(api.productivity.email.outlook.saveFolderDeltaToken, {
              folderId: folder.externalFolderId,
              deltaToken: data['@odata.deltaLink'],
            });
            nextUrl = null; // Done with this folder
          } else {
            nextUrl = null;
          }

          // Safety valve per folder (prevent infinite loops)
          if (folderPages >= 50) {
            console.log(`⚠️ Reached 50 pages limit for ${folder.displayName}`);
            break;
          }
        }

        console.log(`✅ ${folder.displayName}: SYNCED ${folderMessages} messages across ${folderPages} pages`);
      }

      console.log(`✅ Delta sync complete: ${totalMessages} messages across ${pagesProcessed} pages`);

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
    let foldersMigrated = 0;
    const folderDistribution: Record<string, number> = {};
    const now = Date.now();

    // Store each message individually
    console.log(`📧 Processing ${args.messages.length} messages for account ${account._id}`);

    for (const message of args.messages) {
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
    if (messagesStored > 0) {
      const distribution = Object.entries(folderDistribution)
        .map(([folder, count]) => `${folder}:${count}`)
        .join(', ');
      console.log(`✅ Stored ${messagesStored} messages (${distribution})`);
    } else {
      console.log(`✅ No new messages to store`);
    }

    return { messagesStored, foldersMigrated };
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
