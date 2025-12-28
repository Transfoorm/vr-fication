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

export default crons;
