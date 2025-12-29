/**─────────────────────────────────────────────────────────────────────────┐
│  🌉 GOLDEN BRIDGE - Email Body Sync Hook                                  │
│  /src/hooks/useEmailBodySync.ts                                           │
│                                                                            │
│  TTTS-2 COMPLIANT: Syncs email body HTML into FUSE store.                 │
│  - Calls bodyCache.getEmailBody action to fetch from Microsoft Graph     │
│  - Hydrates into FUSE when data arrives                                   │
│  - Components read from FUSE, not from this hook                          │
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
 *
 * @param messageId - Convex document ID of the email message
 */
export function useEmailBodySync(
  messageId: Id<'productivity_email_Index'> | null
): void {
  const user = useFuse((state) => state.user);
  const hydrateEmailBody = useFuse((state) => state.hydrateEmailBody);
  const emailBodies = useFuse((state) => state.productivity.emailBodies);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  // Track which messages we've already fetched
  const fetchedRef = useRef<Set<string>>(new Set());

  // Get the bodyCache action (fetches from Microsoft Graph)
  const getEmailBody = useAction(api.productivity.email.bodyCache.getEmailBody);

  // Skip if body already in FUSE or already fetching
  const alreadyHydrated = messageId && emailBodies ? !!emailBodies[messageId] : false;
  const alreadyFetching = messageId ? fetchedRef.current.has(messageId) : true;

  // Fetch and hydrate when we have a new message to load
  useEffect(() => {
    if (!messageId || !userId || alreadyHydrated || alreadyFetching) {
      return;
    }

    // Mark as fetching
    fetchedRef.current.add(messageId);

    // Call the bodyCache action (fetches from Microsoft Graph)
    getEmailBody({ userId, messageId })
      .then((result) => {
        if (result.body) {
          hydrateEmailBody(messageId, result.body);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch email body:', error);
        // Remove from fetched set so we can retry
        fetchedRef.current.delete(messageId);
      });
  }, [messageId, userId, alreadyHydrated, alreadyFetching, getEmailBody, hydrateEmailBody]);
}
