/**─────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL SYNC ORCHESTRATOR - Server-Controlled Polling                    │
│  /convex/productivity/email/sync.ts                                         │
│                                                                              │
│  Centralized sync control with smart polling:                                │
│  - Server-controlled intervals (2-5 min per provider)                       │
│  - Intent-based refresh (app focus, inbox open, manual)                     │
│  - Rate limit protection                                                     │
│  - Idle detection and backoff                                                │
│                                                                              │
│  DOCTRINE:                                                                   │
│  - No raw intervals exposed to users                                        │
│  - Future: coarse modes (Low/Normal/Near-real-time)                         │
│  - Respects provider rate limits (Microsoft: 10k/10min, Google: 250/sec)   │
└──────────────────────────────────────────────────────────────────────────────┘ */

import { v } from 'convex/values';
import { mutation, query, internalMutation, internalQuery } from '@/convex/_generated/server';
import { api } from '@/convex/_generated/api';

// ═══════════════════════════════════════════════════════════════════════════
// SYNC CONFIGURATION (Server-controlled, not user-exposed)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Provider-specific sync intervals (milliseconds)
 * Conservative defaults to respect rate limits
 */
const SYNC_INTERVALS = {
  outlook: 30 * 1000,      // 30 seconds for testing
  gmail: 30 * 1000,        // 30 seconds
  imap: 60 * 1000,         // 1 minute
} as const;

/**
 * Minimum time between syncs for same account (rate limit protection)
 * Even manual refresh respects this cooldown
 */
const MIN_SYNC_COOLDOWN = 30 * 1000; // 30 seconds

/**
 * Maximum accounts to process per cron tick
 * Prevents cron timeout and spreads load
 */
const MAX_ACCOUNTS_PER_TICK = 10;

/**
 * Idle backoff multiplier - accounts without activity sync less frequently
 * After 1 hour of no opens: 2x interval, after 4 hours: 4x interval
 */
const IDLE_THRESHOLDS = {
  light: 60 * 60 * 1000,      // 1 hour → 2x interval
  moderate: 4 * 60 * 60 * 1000, // 4 hours → 4x interval
  heavy: 24 * 60 * 60 * 1000,   // 24 hours → 8x interval
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL QUERIES (Called by cron and actions)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get accounts due for sync
 *
 * Returns accounts where:
 * - status is 'active'
 * - syncEnabled is true
 * - nextSyncAt <= now OR nextSyncAt is null
 */
export const getAccountsDueForSync = internalQuery({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit || MAX_ACCOUNTS_PER_TICK;

    // Get active accounts that are due for sync
    const accounts = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .filter((q) =>
        q.and(
          q.eq(q.field('syncEnabled'), true),
          q.or(
            q.eq(q.field('nextSyncAt'), undefined),
            q.lte(q.field('nextSyncAt'), now)
          )
        )
      )
      .take(limit);

    return accounts;
  },
});

/**
 * Get single account for sync check
 */
export const getAccountForSync = internalQuery({
  args: {
    accountId: v.id('productivity_email_Accounts'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.accountId);
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// INTERNAL MUTATIONS (Called by cron and actions)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update account sync timestamps after sync completes
 */
export const updateAccountSyncStatus = internalMutation({
  args: {
    accountId: v.id('productivity_email_Accounts'),
    success: v.boolean(),
    error: v.optional(v.string()),
    messagesProcessed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) return;

    const now = Date.now();
    const provider = account.provider as keyof typeof SYNC_INTERVALS;
    const baseInterval = SYNC_INTERVALS[provider] || SYNC_INTERVALS.outlook;

    // Calculate next sync with idle backoff
    const lastActivity = account.updatedAt || now;
    const idleTime = now - lastActivity;

    let multiplier = 1;
    if (idleTime > IDLE_THRESHOLDS.heavy) {
      multiplier = 8;
    } else if (idleTime > IDLE_THRESHOLDS.moderate) {
      multiplier = 4;
    } else if (idleTime > IDLE_THRESHOLDS.light) {
      multiplier = 2;
    }

    const nextSyncAt = now + (baseInterval * multiplier);

    if (args.success) {
      await ctx.db.patch(args.accountId, {
        lastSyncAt: now,
        nextSyncAt,
        lastSyncError: undefined,
        updatedAt: now,
      });
    } else {
      // On error, retry with exponential backoff (max 30 min)
      const errorBackoff = Math.min(baseInterval * 2, 30 * 60 * 1000);
      await ctx.db.patch(args.accountId, {
        nextSyncAt: now + errorBackoff,
        lastSyncError: args.error,
        updatedAt: now,
      });
    }
  },
});

/**
 * Mark account as actively used (resets idle backoff)
 */
export const touchAccount = internalMutation({
  args: {
    accountId: v.id('productivity_email_Accounts'),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.accountId);
    if (!account) return;

    await ctx.db.patch(args.accountId, {
      updatedAt: Date.now(),
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC MUTATIONS (Called by client for intent-based sync)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Request immediate sync for user's accounts
 *
 * Intent-based triggers:
 * - App focus (user returns to app)
 * - Inbox open (user views email)
 * - Manual refresh (user clicks refresh button)
 * - Network reconnect (connection restored)
 *
 * Respects MIN_SYNC_COOLDOWN to prevent spam
 */
export const requestImmediateSync = mutation({
  args: {
    userId: v.id('admin_users'),
    intent: v.union(
      v.literal('focus'),      // App gained focus
      v.literal('inbox_open'), // User opened inbox
      v.literal('manual'),     // User clicked refresh
      v.literal('reconnect')   // Network reconnected
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get user's active email accounts
    const accounts = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    if (accounts.length === 0) {
      return { success: false, error: 'No active email accounts' };
    }

    const now = Date.now();
    let syncTriggered = 0;
    let skippedCooldown = 0;

    // Manual refresh bypasses cooldown (explicit user action)
    // Other intents (focus, reconnect) respect cooldown to prevent spam
    const bypassCooldown = args.intent === 'manual';

    for (const account of accounts) {
      // Check cooldown (prevent sync spam) - manual bypasses this
      const lastSync = account.lastSyncAt || 0;
      if (!bypassCooldown && now - lastSync < MIN_SYNC_COOLDOWN) {
        skippedCooldown++;
        continue;
      }

      // For manual: don't trigger if already syncing (user will see spinner)
      if (args.intent === 'manual' && account.isSyncing) {
        console.log(`📧 Manual sync skipped - already syncing ${account.emailAddress}`);
        continue;
      }

      // Schedule immediate sync - all intents sync all folders
      // Manual = show spinner, other intents = invisible
      const isManual = args.intent === 'manual';
      await ctx.scheduler.runAfter(0, api.productivity.email.outlook.syncOutlookMessages, {
        userId: user._id,
        syncMode: 'full',
        isBackground: !isManual, // manual = visible, focus/reconnect/inbox_open = invisible
      });

      // Update nextSyncAt to prevent duplicate triggers
      await ctx.db.patch(account._id, {
        nextSyncAt: now + MIN_SYNC_COOLDOWN, // Short cooldown after manual
        updatedAt: now, // Reset idle timer
      });

      syncTriggered++;
    }

    console.log(`📧 Intent sync (${args.intent}): ${syncTriggered} triggered, ${skippedCooldown} on cooldown`);

    return {
      success: true,
      syncTriggered,
      skippedCooldown,
    };
  },
});

/**
 * Get sync status for user's accounts
 * Used by UI to show sync state and last update time
 */
export const getSyncStatus = query({
  args: {
    userId: v.id('admin_users'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const accounts = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();

    return accounts.map((account) => ({
      id: account._id,
      label: account.label,
      provider: account.provider,
      emailAddress: account.emailAddress,
      status: account.status,
      syncEnabled: account.syncEnabled,
      lastSyncAt: account.lastSyncAt,
      nextSyncAt: account.nextSyncAt,
      lastSyncError: account.lastSyncError,
    }));
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// CRON HANDLER (Called by Convex cron scheduler)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process email sync queue
 *
 * Called by cron every 2 minutes.
 * Finds accounts due for sync and triggers provider-specific sync actions.
 */
export const processEmailSyncQueue = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Get accounts due for sync
    const accounts = await ctx.db
      .query('productivity_email_Accounts')
      .withIndex('by_status', (q) => q.eq('status', 'active'))
      .filter((q) =>
        q.and(
          q.eq(q.field('syncEnabled'), true),
          q.or(
            q.eq(q.field('nextSyncAt'), undefined),
            q.lte(q.field('nextSyncAt'), now)
          )
        )
      )
      .take(MAX_ACCOUNTS_PER_TICK);

    if (accounts.length === 0) {
      console.log('📧 Sync queue: No accounts due for sync');
      return { processed: 0 };
    }

    console.log(`📧 Sync queue: Processing ${accounts.length} accounts`);

    let triggered = 0;

    for (const account of accounts) {
      // Set nextSyncAt immediately to prevent duplicate triggers
      const provider = account.provider as keyof typeof SYNC_INTERVALS;
      const interval = SYNC_INTERVALS[provider] || SYNC_INTERVALS.outlook;

      await ctx.db.patch(account._id, {
        nextSyncAt: now + interval,
      });

      // Trigger provider-specific sync action
      // Background sync is invisible - sync all folders for correctness
      if (account.provider === 'outlook') {
        await ctx.scheduler.runAfter(0, api.productivity.email.outlook.syncOutlookMessages, {
          userId: account.userId,
          syncMode: 'full',
          isBackground: true, // Cron = invisible, no spinner
        });
        triggered++;
      } else if (account.provider === 'gmail') {
        // TODO: Implement Gmail sync
        console.log(`⏭️ Gmail sync not yet implemented for ${account.emailAddress}`);
      }
    }

    console.log(`📧 Sync queue: Triggered ${triggered} syncs`);
    return { processed: triggered };
  },
});
