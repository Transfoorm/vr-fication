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

import { useEffect, useCallback, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

type SyncIntent = 'focus' | 'inbox_open' | 'manual' | 'reconnect';

interface UseEmailSyncIntentReturn {
  /** Manually trigger a sync refresh */
  triggerManualSync: () => Promise<void>;
  /** Whether a sync is currently in progress (from server) */
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
 *
 * isSyncing is read from server (account.isSyncing) for accurate spinner state.
 */
export function useEmailSyncIntent(): UseEmailSyncIntentReturn {
  const user = useFuse((state) => state.user);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  // LOCAL spinner state - immediate feedback for manual refresh
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get accounts from FUSE to check for active syncs
  const emailAccounts = useFuse((state) => state.productivity.email?.accounts);

  // Check if any account is actively syncing (server-side sync in progress)
  // OR if any account hasn't completed initial sync yet
  const isAccountSyncing = emailAccounts?.some((acc) => {
    // Server says it's syncing
    if (acc.isSyncing) return true;
    // Account exists but hasn't completed initial sync (still downloading)
    const typedAcc = acc as { initialSyncComplete?: boolean };
    if (typedAcc.initialSyncComplete === false) return true;
    return false;
  }) ?? false;

  // isSyncing: spin for manual refresh OR actual account sync
  const isSyncing = isSpinning || isAccountSyncing;

  const requestSync = useMutation(api.productivity.email.sync.requestImmediateSync);

  const lastResultRef = useRef<string | null>(null);
  const isTriggeringRef = useRef(false); // Prevent double-trigger of request

  /**
   * Request sync with specified intent
   */
  const doSync = useCallback(async (intent: SyncIntent) => {
    if (!callerUserId || isTriggeringRef.current) return;

    isTriggeringRef.current = true;
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
      isTriggeringRef.current = false;
    }
  }, [callerUserId, requestSync]);

  /**
   * Manual sync trigger (for refresh button)
   * Spins icon briefly (1.5s) for instant feedback
   */
  const triggerManualSync = useCallback(async () => {
    // Clear any existing timeout
    if (spinTimeoutRef.current) {
      clearTimeout(spinTimeoutRef.current);
    }

    // Start spinning immediately (instant feedback)
    setIsSpinning(true);

    // Stop spinning after 3s (two full rotations)
    spinTimeoutRef.current = setTimeout(() => {
      setIsSpinning(false);
    }, 3000);

    // Fire the sync (runs in background)
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
    isSyncing,
    lastResult: lastResultRef.current,
  };
}
