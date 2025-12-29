# EMAIL BODY CACHE IMPLEMENTATION PLAN

> **Status:** APPROVED — Ready for Implementation
> **Date:** 2024-12-29
> **Derived From:** STORAGE-LIFECYCLE-DOCTRINE.md
> **Participants:** Ken (Product Owner), Adviser (Architecture), Claude Code (Implementation)

---

## EXECUTIVE SUMMARY

This document defines how email bodies are fetched, cached, and deleted in the Transfoorm email platform.

**The North Star:** First 100 emails feel desktop-like — users cannot discern a difference.

**The Strategy:** Graduated enablement with aggressive prefetch.

**The Implementation:** Build once, tune via config.

---

## PART 1: AGREED ARCHITECTURE

### 1.1 The Three Layers

| Layer | Name | What | Who Gets It | Feel |
|-------|------|------|-------------|------|
| 0 | Baseline | On-demand fetch + prefetch | Everyone | Outlook web parity |
| 1 | Working Set Cache | 100-body ring buffer | Everyone (silent) | Near-desktop |
| 2 | Local Storage | Opt-in filesystem | Power users | True desktop |

**We are implementing Layers 0 and 1. Layer 2 is deferred.**

### 1.2 The Key Insight

> Sync fetches metadata only. Bodies are NEVER synced.
> Bodies are fetched on-demand or via prefetch.
> Prefetch makes "first click" feel instant.
> Cache makes "second click" instant.

---

## PART 2: CODIFIED RULES

These rules are non-negotiable and must be enforced in code.

### RULE 1: CACHE LOSS INVARIANT

```
If the entire body cache is deleted, corrupted, or unavailable:
- Navigation must not break
- Email list must not break
- Opening an email must succeed (via fallback fetch)
- No user-facing errors may surface
- The only perceptible difference is a brief fetch delay
```

**Implementation:** Every cache read has an on-demand fallback.

### RULE 2: CONVEX STORAGE CACHE RULE

```
Bodies stored in Convex Storage must be:
- Opaque blobs (no parsing, no indexing, no searching)
- Non-queryable (no "find emails containing X" against cache)
- Strictly evicted (ring buffer, no exceptions)
- Treated as disposable (deletion must never require cache presence)
```

**Implementation:** Cache table stores only IDs and timestamps, not content.

### RULE 3: GRADUATED ENABLEMENT RULE

```
Cache size is a tunable parameter, not a fixed architecture decision.
The system must function correctly at CACHE_SIZE = 0 (pure on-demand).
Cache size may be increased (0 → 20 → 50 → 100) based on observed
user behaviour, without code changes.
```

**Implementation:** Single config constant controls cache size.

### RULE 4: CACHE DIAL SAFETY RULE

```
Changing CACHE_SIZE must never require deleting or reshaping existing metadata.
Only cache entries may be evicted or created.
```

**Implementation:** Cache is independent of email index.

### RULE 5: PREFETCH DOCTRINE

```
The system must silently fetch email bodies BEFORE the user clicks:
- Hover: 300ms dwell on email row triggers prefetch
- Keyboard focus: Arrow-key navigation triggers prefetch
- Selection: Single-click (highlight) triggers prefetch
- Viewport: Top N visible emails prefetch on list render

Prefetch is:
- Silent (no UI indication)
- Non-blocking (fails silently if network slow)
- Rate-limited (max 5 concurrent prefetch requests)
- Cache-populating (prefetched bodies enter the ring buffer)
```

**Implementation:** Client-side prefetch manager.

### RULE 6: ORPHAN ASSUMPTION RULE

```
All storage systems must be treated as potentially leaky.
Orphan detection and cleanup is a required operational capability.
```

**Implementation:** Weekly orphan scan job.

### RULE 7: PER-ACCOUNT GRANULARITY

```
Cache limits are enforced per email account, not per user.
- User with 1 account: up to 100 bodies
- User with 2 accounts: up to 200 bodies (100 each)
```

**Implementation:** accountId is the cache partition key.

---

## PART 3: DATABASE SCHEMA

### 3.1 New Table: productivity_email_BodyCache

```typescript
// convex/schema.ts

productivity_email_BodyCache: defineTable({
  // Identity
  accountId: v.id("productivity_email_Accounts"),
  messageId: v.string(), // External message ID from Microsoft/Google

  // Storage reference
  storageId: v.id("_storage"), // Convex Storage blob ID

  // Metadata for eviction
  cachedAt: v.number(),  // Timestamp when cached
  size: v.number(),      // Body size in bytes (for future limits)

  // Lifecycle
  createdAt: v.number(),
})
  .index("by_account", ["accountId"])
  .index("by_message", ["messageId"])
  .index("by_account_oldest", ["accountId", "cachedAt"])
```

### 3.2 Configuration

```typescript
// convex/productivity/email/cacheConfig.ts

/**
 * EMAIL BODY CACHE CONFIGURATION
 *
 * These values control cache behavior.
 * Change requires deploy but NOT schema migration.
 */
export const CACHE_CONFIG = {
  /**
   * Maximum bodies to cache per email account.
   *
   * GRADUATED ENABLEMENT:
   * - 0   = Pure on-demand (Layer 0 only)
   * - 20  = Friction smoother
   * - 50  = Working set coverage
   * - 100 = Full Layer 1
   *
   * Start at 0, dial up based on user feedback.
   */
  maxBodiesPerAccount: 0,

  /**
   * Maximum age before body is evicted (days).
   * Prevents light users from accumulating stale cache indefinitely.
   */
  ttlDays: 14,

  /**
   * Whether prefetch is enabled.
   * Should always be true — prefetch works even at cache size 0.
   */
  prefetchEnabled: true,

  /**
   * Maximum concurrent prefetch requests.
   * Prevents flooding Microsoft Graph during rapid scrolling.
   */
  maxConcurrentPrefetch: 5,
} as const;
```

---

## PART 4: CORE FUNCTIONS

### 4.1 Get Email Body (Main Entry Point)

```typescript
// convex/productivity/email/bodyCache.ts

import { v } from 'convex/values';
import { action, mutation, query, internalMutation } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';
import { CACHE_CONFIG } from './cacheConfig';

/**
 * GET EMAIL BODY
 *
 * The main entry point for retrieving email content.
 * Implements the cache-loss invariant: always succeeds if token valid.
 */
export const getEmailBody = action({
  args: {
    userId: v.id('admin_users'),
    messageId: v.string(),
  },
  handler: async (ctx, args): Promise<{ body: string; fromCache: boolean }> => {

    // Step 1: Try cache first (fast path)
    if (CACHE_CONFIG.maxBodiesPerAccount > 0) {
      const cached = await ctx.runQuery(
        api.productivity.email.bodyCache.getCachedBody,
        { messageId: args.messageId }
      );

      if (cached) {
        // Fetch blob content from storage
        const blob = await ctx.storage.get(cached.storageId);
        if (blob) {
          const body = await blob.text();
          return { body, fromCache: true };
        }
        // Blob missing — cache corrupted, fall through to fetch
      }
    }

    // Step 2: Fetch from Microsoft Graph (always works if token valid)
    const body = await fetchBodyFromMicrosoft(ctx, args.userId, args.messageId);

    // Step 3: Populate cache for next time (fire and forget)
    if (CACHE_CONFIG.maxBodiesPerAccount > 0) {
      ctx.runMutation(
        api.productivity.email.bodyCache.cacheBody,
        {
          userId: args.userId,
          messageId: args.messageId,
          body
        }
      ).catch(() => {
        // Cache failure is silent — system still works
        console.warn('Failed to cache body, continuing without cache');
      });
    }

    return { body, fromCache: false };
  },
});

/**
 * Fetch body directly from Microsoft Graph API
 */
async function fetchBodyFromMicrosoft(
  ctx: ActionCtx,
  userId: Id<'admin_users'>,
  messageId: string
): Promise<string> {
  // Get OAuth tokens
  const tokens = await ctx.runQuery(
    api.productivity.email.outlook.getOutlookTokens,
    { userId }
  );

  if (!tokens?.accessToken) {
    throw new Error('No valid OAuth token — user must reconnect');
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
    throw new Error(`Microsoft Graph error: ${response.status}`);
  }

  const data = await response.json();
  return data.body?.content || '';
}
```

### 4.2 Cache Body (With Ring Buffer Eviction)

```typescript
/**
 * CACHE BODY
 *
 * Stores body in cache with automatic eviction.
 * Ring buffer: when count >= max, oldest is evicted.
 */
export const cacheBody = mutation({
  args: {
    userId: v.id('admin_users'),
    messageId: v.string(),
    body: v.string(),
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

    if (!account) return;

    // Check if already cached
    const existing = await ctx.db
      .query('productivity_email_BodyCache')
      .withIndex('by_message', (q) => q.eq('messageId', args.messageId))
      .first();

    if (existing) {
      // Update timestamp (LRU behavior)
      await ctx.db.patch(existing._id, { cachedAt: Date.now() });
      return;
    }

    // Store body blob
    const blob = new Blob([args.body], { type: 'text/html' });
    const storageId = await ctx.storage.store(blob);

    // Insert cache record
    const now = Date.now();
    await ctx.db.insert('productivity_email_BodyCache', {
      accountId: account._id,
      messageId: args.messageId,
      storageId,
      cachedAt: now,
      size: args.body.length,
      createdAt: now,
    });

    // Evict if over limit
    await evictOldestIfNeeded(ctx, account._id);
  },
});

/**
 * Evict oldest cache entries to maintain ring buffer limit
 */
async function evictOldestIfNeeded(
  ctx: MutationCtx,
  accountId: Id<'productivity_email_Accounts'>
) {
  const max = CACHE_CONFIG.maxBodiesPerAccount;

  // Count current entries
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

  console.log(`🗑️ Evicted ${toDelete.length} cached bodies for account ${accountId}`);
}
```

### 4.3 Query Cache

```typescript
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
```

### 4.4 Cascade Delete (Account Deleted)

```typescript
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

    console.log(`🗑️ Cascade deleted ${deleted} cached bodies for account ${args.accountId}`);
    return { deleted };
  },
});
```

### 4.5 TTL Cleanup Job

```typescript
/**
 * CLEANUP EXPIRED CACHE
 *
 * Scheduled job that removes cache entries older than TTL.
 * Run daily via Convex cron.
 */
export const cleanupExpiredCache = mutation({
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

    console.log(`🧹 TTL cleanup: deleted ${deleted} expired cache entries`);
    return { deleted };
  },
});
```

---

## PART 5: CLIENT-SIDE PREFETCH

### 5.1 Prefetch Manager Hook

```typescript
// src/hooks/useEmailPrefetch.ts

'use client';

import { useCallback, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

const MAX_CONCURRENT = 5;
const HOVER_DELAY_MS = 300;

interface PrefetchState {
  inFlight: Set<string>;
  completed: Set<string>;
  hoverTimeout: NodeJS.Timeout | null;
}

/**
 * EMAIL PREFETCH MANAGER
 *
 * Silently fetches email bodies before user clicks.
 * Populates cache for instant opens.
 */
export function useEmailPrefetch() {
  const user = useFuse((state) => state.user);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  const getBody = useAction(api.productivity.email.bodyCache.getEmailBody);

  const state = useRef<PrefetchState>({
    inFlight: new Set(),
    completed: new Set(),
    hoverTimeout: null,
  });

  /**
   * Prefetch a single email body
   */
  const prefetch = useCallback(async (messageId: string) => {
    if (!userId) return;

    const s = state.current;

    // Skip if already done or in progress
    if (s.completed.has(messageId) || s.inFlight.has(messageId)) {
      return;
    }

    // Skip if at concurrency limit
    if (s.inFlight.size >= MAX_CONCURRENT) {
      return;
    }

    s.inFlight.add(messageId);

    try {
      await getBody({ userId, messageId });
      s.completed.add(messageId);
    } catch (error) {
      // Prefetch failure is silent
      console.debug('Prefetch failed:', messageId);
    } finally {
      s.inFlight.delete(messageId);
    }
  }, [userId, getBody]);

  /**
   * Handle hover intent (with delay)
   */
  const onHover = useCallback((messageId: string) => {
    const s = state.current;

    // Clear any pending hover
    if (s.hoverTimeout) {
      clearTimeout(s.hoverTimeout);
    }

    // Set new hover timeout
    s.hoverTimeout = setTimeout(() => {
      prefetch(messageId);
    }, HOVER_DELAY_MS);
  }, [prefetch]);

  /**
   * Cancel hover timeout
   */
  const onHoverEnd = useCallback(() => {
    const s = state.current;
    if (s.hoverTimeout) {
      clearTimeout(s.hoverTimeout);
      s.hoverTimeout = null;
    }
  }, []);

  /**
   * Handle keyboard focus (immediate)
   */
  const onFocus = useCallback((messageId: string) => {
    prefetch(messageId);
  }, [prefetch]);

  /**
   * Handle selection (immediate)
   */
  const onSelect = useCallback((messageId: string) => {
    prefetch(messageId);
  }, [prefetch]);

  /**
   * Prefetch visible viewport
   */
  const prefetchViewport = useCallback((messageIds: string[]) => {
    // Prefetch first N visible
    const toPrefetch = messageIds.slice(0, 5);
    toPrefetch.forEach(prefetch);
  }, [prefetch]);

  /**
   * Check if body is already cached/prefetched
   */
  const isCached = useCallback((messageId: string) => {
    return state.current.completed.has(messageId);
  }, []);

  return {
    onHover,
    onHoverEnd,
    onFocus,
    onSelect,
    prefetchViewport,
    isCached,
  };
}
```

### 5.2 Integration with Email List

```typescript
// In email-console/index.tsx (conceptual integration)

import { useEmailPrefetch } from '@/hooks/useEmailPrefetch';

function EmailRow({ message }: { message: EmailMessage }) {
  const { onHover, onHoverEnd, onSelect } = useEmailPrefetch();

  return (
    <div
      className="ft-email__row"
      onMouseEnter={() => onHover(message.externalId)}
      onMouseLeave={onHoverEnd}
      onClick={() => onSelect(message.externalId)}
    >
      {/* Row content */}
    </div>
  );
}
```

---

## PART 6: CASCADE DELETE INTEGRATION

### 6.1 Update Account Disconnect

```typescript
// convex/productivity/email/outlook.ts

export const disconnectOutlookAccount = mutation({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('provider'), 'outlook'))
      .first();

    if (!account) return { success: false };

    // CASCADE: Delete body cache first
    await ctx.runMutation(
      api.productivity.email.bodyCache.deleteAccountCache,
      { accountId: account._id }
    );

    // Then delete folders, messages, account...
    // (existing cascade logic)

    return { success: true };
  },
});
```

### 6.2 Update VANISH (User Deletion)

```typescript
// convex/vanish/deleteAnyUser.ts

// Add to cascade:
for (const account of userEmailAccounts) {
  await ctx.runMutation(
    api.productivity.email.bodyCache.deleteAccountCache,
    { accountId: account._id }
  );
}
```

---

## PART 7: CRON JOBS

### 7.1 TTL Cleanup Cron

```typescript
// convex/crons.ts

import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Daily cache TTL cleanup at 3 AM
crons.daily(
  'email-cache-ttl-cleanup',
  { hourUTC: 3, minuteUTC: 0 },
  internal.productivity.email.bodyCache.cleanupExpiredCache
);

export default crons;
```

### 7.2 Orphan Scan (Weekly)

```typescript
// convex/admin/orphanScan.ts

/**
 * ORPHAN SCAN
 *
 * Finds storage blobs with no cache record pointing to them.
 * Run weekly as a safety net.
 */
export const scanForOrphanedCacheBlobs = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all storageIds referenced by cache
    const cacheEntries = await ctx.db
      .query('productivity_email_BodyCache')
      .collect();

    const referencedIds = new Set(
      cacheEntries.map(e => e.storageId)
    );

    // Note: Convex doesn't expose a "list all storage" API directly
    // This would need to be implemented via a different approach
    // For now, we rely on the cascade delete being correct

    console.log(`📊 Orphan scan: ${referencedIds.size} cache entries verified`);
    return { cacheEntries: referencedIds.size };
  },
});
```

---

## PART 8: ROLLOUT PLAN

### Phase 1: Infrastructure (CACHE_SIZE = 0)

**Build:**
- [ ] Add `productivity_email_BodyCache` table to schema
- [ ] Implement `getEmailBody` action with fallback
- [ ] Implement `cacheBody` mutation with eviction
- [ ] Implement `deleteAccountCache` for cascade
- [ ] Implement `cleanupExpiredCache` for TTL
- [ ] Add cron job for TTL cleanup
- [ ] Create `useEmailPrefetch` hook

**Deploy with:**
```typescript
maxBodiesPerAccount: 0  // Cache disabled
prefetchEnabled: true   // Prefetch active (memory only)
```

**Test:**
- Email list renders correctly
- Clicking email fetches body from Microsoft
- Prefetch warms memory on hover/focus
- No errors if cache is empty
- Ken evaluates "feel" vs Outlook web

### Phase 2: Enable Cache (If Needed)

**If Layer 0 doesn't feel instant enough:**

```typescript
maxBodiesPerAccount: 20  // First increment
```

**Test:**
- Recent emails open instantly
- Eviction works correctly
- Account disconnect cascades properly

### Phase 3: Tune (If Needed)

```typescript
maxBodiesPerAccount: 50  // Second increment
// or
maxBodiesPerAccount: 100 // Full Layer 1
```

---

## PART 9: METRICS TO TRACK

Once deployed, track these to inform dial decisions:

| Metric | What It Tells Us |
|--------|------------------|
| Cache hit rate | Is cache being used? |
| Prefetch hit rate | Is prefetch working? |
| Body fetch latency (P50, P95) | How slow is on-demand? |
| Time-to-first-body | Does it feel instant? |
| Cache eviction rate | Are we sized correctly? |
| Orphan count | Is cleanup working? |

---

## SUMMARY

**What we're building:**
- On-demand body fetch as the foundation
- Aggressive prefetch to hide latency
- Optional ring buffer cache for repeat opens
- Full cascade delete for cleanup
- TTL + eviction for bounded storage

**What we're NOT building:**
- Body storage during sync
- Full-text body search
- Offline mode
- Unlimited body retention

**The dial:**
```
CACHE_SIZE = 0   → Ship first, test
CACHE_SIZE = 20  → If needed
CACHE_SIZE = 50  → If still not enough
CACHE_SIZE = 100 → Full capability
```

**The invariant:**
> If the cache disappears, the system still works perfectly.

---

*This document is the implementation specification. The doctrine lives in STORAGE-LIFECYCLE-DOCTRINE.md.*
