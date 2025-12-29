/**─────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL SYNC INTENT HOOK - Smart Polling Triggers                        │
│  /src/hooks/useEmailSyncIntent.ts                                           │
│                                                                              │
│  Intent-based sync triggers:                                                 │
│  - App focus (user returns to app)                                          │
│  - Inbox open (user views email)                                            │
│  - Network reconnect (connection restored)                                   │
│  - Manual refresh (user clicks button)                                      │
│                                                                              │
│  DOCTRINE:                                                                   │
│  - Server controls sync intervals (no raw intervals exposed)                │
│  - Respects MIN_SYNC_COOLDOWN (30s) - server will skip if too soon          │
│  - Pauses when app is backgrounded                                          │
└──────────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

type SyncIntent = 'focus' | 'inbox_open' | 'manual' | 'reconnect';

interface UseEmailSyncIntentReturn {
  /** Manually trigger a sync refresh */
  triggerManualSync: () => Promise<void>;
  /** Whether a sync is currently in progress */
  isSyncing: boolean;
  /** Last sync result message */
  lastResult: string | null;
}

/**
 * Email Sync Intent Hook
 *
 * Provides intent-based sync triggers for the email console.
 * Automatically triggers sync on:
 * - Window focus (user returns to app)
 * - Network online (connection restored)
 *
 * Manual triggers available for:
 * - Inbox open (call when entering email view)
 * - Refresh button (user clicks refresh)
 */
export function useEmailSyncIntent(): UseEmailSyncIntentReturn {
  const user = useFuse((state) => state.user);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  const requestSync = useMutation(api.productivity.email.sync.requestImmediateSync);

  const isSyncingRef = useRef(false);
  const lastResultRef = useRef<string | null>(null);

  /**
   * Request sync with specified intent
   */
  const doSync = useCallback(async (intent: SyncIntent) => {
    if (!callerUserId || isSyncingRef.current) return;

    isSyncingRef.current = true;
    try {
      const result = await requestSync({
        userId: callerUserId,
        intent,
      });

      if (result.success) {
        lastResultRef.current = `Synced ${result.syncTriggered} account(s)`;
      } else {
        lastResultRef.current = result.error || 'Sync failed';
      }
    } catch (error) {
      lastResultRef.current = 'Sync error';
      console.error('Email sync failed:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [callerUserId, requestSync]);

  /**
   * Manual sync trigger (for refresh button)
   */
  const triggerManualSync = useCallback(async () => {
    await doSync('manual');
  }, [doSync]);

  // ═══════════════════════════════════════════════════════════════════════
  // AUTOMATIC INTENT TRIGGERS
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!callerUserId) return;

    // Window focus handler
    const handleFocus = () => {
      doSync('focus');
    };

    // Network online handler
    const handleOnline = () => {
      doSync('reconnect');
    };

    // Register event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Trigger initial sync when hook mounts (inbox open)
    doSync('inbox_open');

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [callerUserId, doSync]);

  return {
    triggerManualSync,
    isSyncing: isSyncingRef.current,
    lastResult: lastResultRef.current,
  };
}
