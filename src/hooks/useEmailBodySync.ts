/**─────────────────────────────────────────────────────────────────────────┐
│  🌉 GOLDEN BRIDGE - Email Body Sync Hook                                  │
│  /src/hooks/useEmailBodySync.ts                                           │
│                                                                            │
│  TTTS-2 COMPLIANT: Syncs email body HTML into FUSE store.                 │
│  - Calls Convex action to get HTML content (action reads storage)         │
│  - Hydrates into FUSE when data arrives                                   │
│  - Components read from FUSE, not from this hook                          │
│                                                                            │
│  WHY ACTION (not query):                                                   │
│  Convex queries can't read storage blobs (ctx.storage.get is action-only) │
│  Actions return data once, not reactively, which is fine for email bodies │
│  since they don't change after sync.                                       │
│                                                                            │
│  WHY ON-DEMAND (not preloaded):                                           │
│  Email bodies are large HTML blobs. Preloading all would bloat FUSE.      │
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
 * Syncs email body HTML from Convex into FUSE store.
 * Does NOT return data - components read from FUSE.
 *
 * @param messageId - The ID of the email message to sync body for
 */
export function useEmailBodySync(
  messageId: Id<'productivity_email_Index'> | null
): void {
  const user = useFuse((state) => state.user);
  const hydrateEmailBody = useFuse((state) => state.hydrateEmailBody);
  const emailBodies = useFuse((state) => state.productivity.emailBodies);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  // Track which messages we've already fetched
  const fetchedRef = useRef<Set<string>>(new Set());

  // Get the action
  const getEmailBody = useAction(api.domains.productivity.actions.getEmailBody);

  // Skip if body already in FUSE or already fetching
  const alreadyHydrated = messageId && emailBodies ? !!emailBodies[messageId] : false;
  const alreadyFetching = messageId ? fetchedRef.current.has(messageId) : true;

  // Fetch and hydrate when we have a new message to load
  useEffect(() => {
    if (!messageId || !callerUserId || alreadyHydrated || alreadyFetching) {
      return;
    }

    // Mark as fetching
    fetchedRef.current.add(messageId);

    // Call the action
    getEmailBody({ callerUserId, messageId })
      .then((result) => {
        if (result.htmlContent) {
          hydrateEmailBody(messageId, result.htmlContent);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch email body:', error);
        // Remove from fetched set so we can retry
        fetchedRef.current.delete(messageId);
      });
  }, [messageId, callerUserId, alreadyHydrated, alreadyFetching, getEmailBody, hydrateEmailBody]);
}
