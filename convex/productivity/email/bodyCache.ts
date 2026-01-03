/**──────────────────────────────────────────────────────────────────────────────┐
│  📦 EMAIL BODY CACHE - Latency Management System                              │
│  /convex/productivity/email/bodyCache.ts                                      │
│                                                                                │
│  DOCTRINE:                                                                     │
│  - Cache Loss Invariant: System works if cache disappears                     │
│  - Bodies are acceleration artifacts, never authoritative                     │
│  - Prefetch is primary, cache is secondary                                    │
│  - Ring buffer eviction: oldest evicted when count >= max                     │
│                                                                                │
│  See: /docs/EMAIL-BODY-CACHE-IMPLEMENTATION.md                                │
│  See: /docs/STORAGE-LIFECYCLE-DOCTRINE.md                                     │
└──────────────────────────────────────────────────────────────────────────────*/

import { v } from 'convex/values';
import { mutation, query, action, internalMutation } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { ActionCtx, MutationCtx } from '@/convex/_generated/server';
import { CACHE_CONFIG } from './cacheConfig';

// Result type for email body fetch
export type EmailBodyResult = {
  body: string;
  fromCache: boolean;
  status: 'ok' | 'not_found' | 'rate_limited' | 'error';
  retryAfter?: number; // Seconds to wait before retry (for rate_limited)
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET EMAIL BY ID (internal query)
 *
 * Looks up email record to get externalMessageId.
 * Used by getEmailBody action.
 */
export const getEmailById = query({
  args: {
    messageId: v.id('productivity_email_Index'),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;
    return {
      externalMessageId: message.externalMessageId,
      accountId: message.accountId,
    };
  },
});

/**
 * GET EMAIL BODY
 *
 * The main entry point for retrieving email content.
 * Implements the cache-loss invariant: always succeeds if token valid.
 *
 * Flow:
 * 1. Look up email record to get external message ID
 * 2. Try cache first (fast path) - if CACHE_SIZE > 0
 * 3. Fallback to Microsoft Graph (always works)
 * 4. Populate cache for next time (fire and forget)
 *
 * @returns Body HTML/text and whether it came from cache
 */
export const getEmailBody = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.id('productivity_email_Index'), // Convex document ID
  },
  handler: async (ctx, args): Promise<EmailBodyResult> => {
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 0: Look up email record to get external message ID
    // ─────────────────────────────────────────────────────────────────────────
    const emailRecord = await ctx.runQuery(
      api.productivity.email.bodyCache.getEmailById,
      { messageId: args.messageId }
    );

    if (!emailRecord) {
      return { body: '', fromCache: false, status: 'not_found' as const };
    }

    const externalMessageId = emailRecord.externalMessageId;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Try cache first (fast path)
    // ─────────────────────────────────────────────────────────────────────────
    if (CACHE_CONFIG.maxBodiesPerAccount > 0) {
      const cached = await ctx.runQuery(
        api.productivity.email.bodyCache.getCachedBody,
        { messageId: externalMessageId }
      );

      if (cached) {
        // Fetch blob content from Convex Storage
        const blob = await ctx.storage.get(cached.storageId);
        if (blob) {
          const body = await blob.text();

          // Update LRU timestamp (fire and forget)
          ctx.runMutation(
            api.productivity.email.bodyCache.touchCacheEntry,
            { messageId: externalMessageId }
          ).catch(() => {
            // Touch failure is silent
          });

          return { body, fromCache: true, status: 'ok' as const };
        }
        // Blob missing — cache corrupted, fall through to fetch
        console.warn(`⚠️ Cache blob missing for ${externalMessageId}, fetching fresh`);
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Fetch from Microsoft Graph (always works if token valid)
    // ─────────────────────────────────────────────────────────────────────────
    const fetchResult = await fetchBodyFromMicrosoft(ctx, args.userId, externalMessageId);

    // If fetch failed (404, 429, error), return immediately with status
    if (fetchResult.status !== 'ok') {
      return { ...fetchResult, fromCache: false };
    }

    const body = fetchResult.body;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Populate cache for next time (fire and forget)
    // ─────────────────────────────────────────────────────────────────────────
    if (CACHE_CONFIG.maxBodiesPerAccount > 0 && body) {
      // Actions can store blobs, mutations cannot
      try {
        const storageId = await ctx.storage.store(new Blob([body], { type: 'text/html' }));
        ctx.runMutation(
          api.productivity.email.bodyCache.recordCacheEntry,
          {
            userId: args.userId,
            messageId: externalMessageId,
            storageId,
            size: body.length,
          }
        ).catch(() => {
          // Cache failure is silent — system still works
          console.warn('Failed to record cache entry, continuing without cache');
        });
      } catch {
        // Storage failure is silent
        console.warn('Failed to store body blob, continuing without cache');
      }
    }

    return { body, fromCache: false, status: 'ok' as const };
  },
});

// Internal result type for Microsoft fetch
type MicrosoftFetchResult = {
  body: string;
  status: 'ok' | 'not_found' | 'rate_limited' | 'error';
  retryAfter?: number;
};

/**
 * Fetch body directly from Microsoft Graph API
 */
async function fetchBodyFromMicrosoft(
  ctx: ActionCtx,
  userId: Id<'admin_users'>,
  messageId: string
): Promise<MicrosoftFetchResult> {
  // Get OAuth tokens
  let tokens = await ctx.runQuery(
    api.productivity.email.outlook.getOutlookTokens,
    { userId }
  ) as { accessToken?: string; refreshToken: string; expiresAt?: number } | null;

  if (!tokens?.accessToken) {
    return { body: '', status: 'error' };
  }

  // Check if token needs refresh (expires within 5 minutes)
  const now = Date.now();
  if (tokens.expiresAt && tokens.expiresAt < now + 5 * 60 * 1000) {
    console.log('🔄 Body fetch: Token expired, refreshing...');
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

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json() as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        // Store new tokens
        await ctx.runMutation(api.productivity.email.outlook.storeOutlookTokens, {
          userId,
          accessToken: refreshData.access_token,
          refreshToken: refreshData.refresh_token || tokens.refreshToken,
          expiresAt: now + refreshData.expires_in * 1000,
          scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/User.Read offline_access',
        });

        tokens = { ...tokens, accessToken: refreshData.access_token };
        console.log('✅ Body fetch: Token refreshed');
      }
    } catch {
      console.error('Token refresh failed in body fetch');
    }
  }

  // Fetch from Microsoft Graph
  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}?$select=body`,
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Microsoft Graph error: ${response.status}`, errorText);
    // 404 = message no longer exists (deleted, moved, or stale reference)
    if (response.status === 404) {
      console.log(`⚠️ Message not found in Microsoft Graph (404) - may have been deleted`);
      return { body: '', status: 'not_found' };
    }
    // 429 = Rate limited - return with retry hint
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 5;
      console.log(`⚠️ Microsoft rate limit (429) - retry after ${retryAfter}s`);
      return { body: '', status: 'rate_limited', retryAfter };
    }
    return { body: '', status: 'error' };
  }

  const data = await response.json() as { body?: { content?: string } };
  return { body: data.body?.content || '', status: 'ok' };
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET CACHED BODY
 *
 * Simple lookup — returns null if not cached.
 */
export const getCachedBody = query({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_message', (q) => q.eq('messageId', args.messageId))
      .first();
  },
});

/**
 * TOUCH CACHE ENTRY
 *
 * Updates cachedAt timestamp for LRU behavior.
 * Called when a cached body is accessed.
 */
export const touchCacheEntry = mutation({
  args: {
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const entry = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_message', (q) => q.eq('messageId', args.messageId))
      .first();

    if (entry) {
      await ctx.db.patch(entry._id, {
        cachedAt: Date.now(),
      });
    }
  },
});

/**
 * RECORD CACHE ENTRY
 *
 * Records a cache entry after blob is stored by action.
 * Ring buffer: when count >= max, oldest is evicted.
 *
 * Note: Blob storage happens in getEmailBody action because
 * mutations cannot use ctx.storage.store().
 */
export const recordCacheEntry = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.string(),
    storageId: v.id('_storage'),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    // Skip if caching disabled
    if (CACHE_CONFIG.maxBodiesPerAccount === 0) {
      return;
    }

    // Get user's email account
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) {
      console.warn('⚠️ No account found for recording cache entry');
      return;
    }

    // Check if already cached
    const existing = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_message', (q) => q.eq('messageId', args.messageId))
      .first();

    if (existing) {
      // Update timestamp (LRU behavior)
      await ctx.db.patch(existing._id, { cachedAt: Date.now() });
      // Clean up the duplicate blob we just stored
      await ctx.storage.delete(args.storageId);
      return;
    }

    // Insert cache record
    const now = Date.now();
    await ctx.db.insert('productivity_email_BodyCache', {
      accountId: account._id,
      messageId: args.messageId,
      storageId: args.storageId,
      cachedAt: now,
      size: args.size,
      createdAt: now,
    });

    // Evict if over limit
    await evictOldestIfNeeded(ctx, account._id);
  },
});

/**
 * Evict oldest cache entries to maintain ring buffer limit
 *
 * This is called inline within cacheBody mutation.
 * Uses the same ctx from the parent mutation.
 */
async function evictOldestIfNeeded(
  ctx: MutationCtx,
  accountId: Id<'productivity_email_Accounts'>
) {
  const max = CACHE_CONFIG.maxBodiesPerAccount;

  // Count current entries for this account
  const entries = await ctx.db
    .query('productivity_email_BodyCache')
    .withIndex('by_account', (q) => q.eq('accountId', accountId))
    .collect();

  if (entries.length <= max) return;

  // Sort by cachedAt (oldest first)
  entries.sort((a, b) => a.cachedAt - b.cachedAt);

  // Delete oldest until at limit
  const toDelete = entries.slice(0, entries.length - max);

  for (const entry of toDelete) {
    // Delete storage blob first
    await ctx.storage.delete(entry.storageId);
    // Delete cache record
    await ctx.db.delete(entry._id);
  }

  if (toDelete.length > 0) {
    console.log(`🗑️ Evicted ${toDelete.length} cached bodies for account ${accountId}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CASCADE DELETE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * DELETE ACCOUNT CACHE
 *
 * Called when email account is disconnected or deleted.
 * Deletes all cached bodies for that account.
 */
export const deleteAccountCache = mutation({
  args: {
    accountId: v.id('productivity_email_Accounts'),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_account', (q) => q.eq('accountId', args.accountId))
      .collect();

    let deleted = 0;
    for (const entry of entries) {
      // Delete storage blob
      await ctx.storage.delete(entry.storageId);
      // Delete cache record
      await ctx.db.delete(entry._id);
      deleted++;
    }

    if (deleted > 0) {
      console.log(`🗑️ Cascade deleted ${deleted} cached bodies for account ${args.accountId}`);
    }
    return { deleted };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// TTL CLEANUP
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CLEANUP EXPIRED CACHE
 *
 * Scheduled job that removes cache entries older than TTL.
 * Run daily via Convex cron.
 */
export const cleanupExpiredCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ttlMs = CACHE_CONFIG.ttlDays * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - ttlMs;

    // Find all expired entries
    const expired = await ctx.db
      .query('productivity_email_BodyCache')
      .filter((q) => q.lt(q.field('cachedAt'), cutoff))
      .collect();

    let deleted = 0;
    for (const entry of expired) {
      await ctx.storage.delete(entry.storageId);
      await ctx.db.delete(entry._id);
      deleted++;
    }

    if (deleted > 0) {
      console.log(`🧹 TTL cleanup: deleted ${deleted} expired cache entries`);
    }
    return { deleted };
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * PURGE ALL BODY CACHE
 *
 * Emergency cleanup - deletes ALL body cache entries and blobs.
 * Use when cache is disabled and orphaned blobs need cleanup.
 */
export const purgeAllBodyCache = internalMutation({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query('productivity_email_BodyCache')
      .collect();

    let deleted = 0;
    for (const entry of entries) {
      await ctx.storage.delete(entry.storageId);
      await ctx.db.delete(entry._id);
      deleted++;
    }

    console.log(`🗑️ Purged ALL body cache: ${deleted} entries deleted`);
    return { deleted };
  },
});

/**
 * GET CACHE STATS
 *
 * Returns cache statistics for a user's account.
 * Useful for debugging and monitoring.
 */
export const getCacheStats = query({
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

    const entries = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_account', (q) => q.eq('accountId', account._id))
      .collect();

    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const oldestEntry = entries.length > 0
      ? Math.min(...entries.map(e => e.cachedAt))
      : null;
    const newestEntry = entries.length > 0
      ? Math.max(...entries.map(e => e.cachedAt))
      : null;

    return {
      accountId: account._id,
      cacheSize: entries.length,
      maxSize: CACHE_CONFIG.maxBodiesPerAccount,
      totalBytes: totalSize,
      oldestEntry,
      newestEntry,
      ttlDays: CACHE_CONFIG.ttlDays,
      cacheEnabled: CACHE_CONFIG.maxBodiesPerAccount > 0,
    };
  },
});
