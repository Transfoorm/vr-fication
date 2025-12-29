/**─────────────────────────────────────────────────────────────────────────┐
│  ⏰ CONVEX CRON SCHEDULER                                                   │
│  /convex/crons.ts                                                           │
│                                                                              │
│  Server-controlled scheduled tasks.                                         │
│                                                                              │
│  CURRENT CRONS:                                                             │
│  - Email sync: Every 2 minutes, processes accounts due for sync             │
│                                                                              │
│  DOCTRINE:                                                                   │
│  - Crons are server-controlled (no user-exposed intervals)                  │
│  - Each cron should be lightweight (delegate to actions for heavy work)     │
│  - Log meaningful messages for observability                                │
└──────────────────────────────────────────────────────────────────────────────┘ */

import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SYNC CRON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process email sync queue every 2 minutes
 *
 * Finds accounts due for sync based on their nextSyncAt timestamp
 * and triggers provider-specific sync actions.
 *
 * Why 2 minutes:
 * - Fast enough for near-real-time feel
 * - Conservative enough to respect provider rate limits
 * - Accounts can adjust individually via idle backoff
 */
crons.interval(
  'email-sync-queue',
  { minutes: 2 },
  internal.productivity.email.sync.processEmailSyncQueue
);

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK RENEWAL CRON
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renew expiring webhook subscriptions every hour
 *
 * Microsoft Graph webhooks expire after ~3 days (max 4230 minutes).
 * This job checks for subscriptions expiring in the next 2 hours
 * and renews them proactively.
 *
 * Why 1 hour:
 * - Gives buffer before expiration
 * - Handles any temporary API failures gracefully
 * - Low overhead (only queries, no heavy processing)
 */
crons.interval(
  'webhook-renewal-queue',
  { hours: 1 },
  internal.productivity.email.webhooks.processWebhookRenewalQueue
);

export default crons;
