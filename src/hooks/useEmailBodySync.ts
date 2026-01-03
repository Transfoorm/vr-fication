/**─────────────────────────────────────────────────────────────────────────┐
│  🌉 GOLDEN BRIDGE - Email Body Sync Hook                                  │
│  /src/hooks/useEmailBodySync.ts                                           │
│                                                                            │
│  TTTS-2 COMPLIANT: Syncs email body HTML into FUSE store.                 │
│  - Calls bodyCache.getEmailBody action to fetch from Microsoft Graph     │
│  - Hydrates into FUSE when data arrives                                   │
│  - Components read from FUSE, not from this hook                          │
│  - Shows loading state while fetching                                     │
│  - Auto-retries on rate limit with backoff                                │
│                                                                            │
│  ARCHITECTURE (per EMAIL-BODY-CACHE-IMPLEMENTATION.md):                   │
│  - Bodies are fetched on-demand from Microsoft, NOT stored during sync   │
│  - CACHE_SIZE=0: Pure on-demand, no blobs stored                         │
│  - CACHE_SIZE>0: Bodies cached in ring buffer for faster re-access       │
│                                                                            │
│  WHY ACTION (not query):                                                   │
│  Actions can fetch from external APIs (Microsoft Graph) and store blobs  │
└────────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Email Body Sync Hook
 *
 * Fetches email body HTML from Microsoft Graph via bodyCache action.
 * Hydrates into FUSE store for component consumption.
 * Shows loading states and auto-retries on rate limit.
 *
 * @param messageId - Convex document ID of the email message
 */
export function useEmailBodySync(
  messageId: Id<'productivity_email_Index'> | null
): void {
  const user = useFuse((state) => state.user);
  const hydrateEmailBody = useFuse((state) => state.hydrateEmailBody);
  const setEmailBodyStatus = useFuse((state) => state.setEmailBodyStatus);
  const emailBodies = useFuse((state) => state.productivity.emailBodies);
  const emailBodyStatus = useFuse((state) => state.productivity.emailBodyStatus);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  // Track active retry timers to cancel on unmount
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get the bodyCache action (fetches from Microsoft Graph)
  const getEmailBody = useAction(api.productivity.email.bodyCache.getEmailBody);

  // Skip if body already in FUSE or already loading
  const alreadyHydrated = messageId && emailBodies ? !!emailBodies[messageId] : false;
  const currentStatus = messageId ? emailBodyStatus?.[messageId] : undefined;
  const isLoading = currentStatus === 'loading' || currentStatus === 'rate_limited';

  // Fetch and hydrate when we have a new message to load
  useEffect(() => {
    if (!messageId || !userId || alreadyHydrated || isLoading) {
      return;
    }

    // Set loading state
    setEmailBodyStatus(messageId, 'loading');

    // Fetch function (can be called for retry)
    const fetchBody = () => {
      getEmailBody({ userId, messageId })
        .then((result) => {
          if (result.status === 'ok' && result.body) {
            hydrateEmailBody(messageId, result.body);
            setEmailBodyStatus(messageId, 'loaded');
          } else if (result.status === 'rate_limited') {
            // Set rate_limited status and schedule retry
            setEmailBodyStatus(messageId, 'rate_limited');
            const retrySeconds = result.retryAfter ?? 5;
            console.log(`⏳ Rate limited, retrying in ${retrySeconds}s...`);
            retryTimerRef.current = setTimeout(() => {
              setEmailBodyStatus(messageId, 'loading');
              fetchBody(); // Retry
            }, retrySeconds * 1000);
          } else if (result.status === 'not_found') {
            // Message deleted/moved - mark as loaded with empty
            hydrateEmailBody(messageId, ''); // Empty body
            setEmailBodyStatus(messageId, 'loaded');
          } else {
            // Generic error
            setEmailBodyStatus(messageId, 'error');
          }
        })
        .catch((error) => {
          console.error('Failed to fetch email body:', error);
          setEmailBodyStatus(messageId, 'error');
        });
    };

    fetchBody();

    // Cleanup: cancel any pending retry
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [messageId, userId, alreadyHydrated, isLoading, getEmailBody, hydrateEmailBody, setEmailBodyStatus]);
}
