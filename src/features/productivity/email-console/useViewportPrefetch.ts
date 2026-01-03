'use client';

/**─────────────────────────────────────────────────────────────────────────┐
│  VIEWPORT PREFETCH HOOK                                                   │
│  /src/features/productivity/email-console/useViewportPrefetch.ts          │
│                                                                            │
│  Prefetches email bodies for visible messages before user clicks.         │
│  - Priority: selected message first, then visible viewport                │
│  - Throttled: max 2 concurrent, 300ms delay between requests              │
│  - Silent failure: no UI indicators, just retry on next visibility        │
│  - LRU eviction handled by FUSE store                                     │
│  - HARDENED: Tracks pending IDs to prevent duplicate fetches              │
│                                                                            │
│  Invariant: "There must always be at least one message body ready         │
│              before the user can plausibly act"                            │
└────────────────────────────────────────────────────────────────────────────┘ */

import { useEffect, useRef, useCallback } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

// Throttle settings to avoid Microsoft Graph 429 rate limits
const MAX_CONCURRENT = 2;      // Only 2 requests at a time
const REQUEST_DELAY_MS = 300;  // 300ms between each request
const MAX_PREFETCH = 8;        // Prefetch up to 8 messages per viewport change

/**
 * Viewport Prefetch Hook
 *
 * Prefetches email bodies for visible messages with throttling.
 * Silent, no spinners, no persistence.
 *
 * @param visibleMessageIds - IDs of messages currently visible in viewport
 * @param selectedId - Currently selected message ID (gets priority)
 */
export function useViewportPrefetch(
  visibleMessageIds: string[],
  selectedId: string | null
): void {
  const user = useFuse((state) => state.user);
  const hydrateEmailBody = useFuse((state) => state.hydrateEmailBody);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  // Track pending fetches by ID (prevents duplicates)
  const pendingRef = useRef<Set<string>>(new Set());
  const inflightCountRef = useRef(0);

  // Get the bodyCache action
  const getEmailBody = useAction(api.productivity.email.bodyCache.getEmailBody);

  // Stable fetch function with deduplication
  const fetchBody = useCallback(async (messageId: string) => {
    if (!userId) return;

    // GUARD: Skip if already pending or in FUSE
    if (pendingRef.current.has(messageId)) return;
    const currentBodies = useFuse.getState().productivity.emailBodies;
    if (currentBodies?.[messageId]) return;

    // Mark as pending BEFORE any async work
    pendingRef.current.add(messageId);

    // Wait for slot
    while (inflightCountRef.current >= MAX_CONCURRENT) {
      await new Promise((r) => setTimeout(r, 50));
    }

    inflightCountRef.current++;

    try {
      const result = await getEmailBody({
        userId,
        messageId: messageId as Id<'productivity_email_Index'>
      });
      if (result.body) {
        hydrateEmailBody(messageId, result.body);
      }
    } catch {
      // Silent failure - remove from pending so it can retry later
    } finally {
      inflightCountRef.current--;
      pendingRef.current.delete(messageId);
    }
  }, [userId, getEmailBody, hydrateEmailBody]);

  // Main effect - runs only when visible IDs or selection changes
  // NOT when emailBodies changes (that would cause cascade)
  useEffect(() => {
    if (!userId || visibleMessageIds.length === 0) return;

    // Priority order: selected first, then visible
    const priority = selectedId
      ? [selectedId, ...visibleMessageIds.filter((id) => id !== selectedId)]
      : visibleMessageIds;

    // Filter to: not in FUSE, not pending
    const currentBodies = useFuse.getState().productivity.emailBodies;
    const toFetch = priority
      .filter((id) => !currentBodies?.[id] && !pendingRef.current.has(id))
      .slice(0, MAX_PREFETCH);

    if (toFetch.length === 0) return;

    // Stagger the fetches
    let cancelled = false;

    (async () => {
      for (let i = 0; i < toFetch.length; i++) {
        if (cancelled) break;

        fetchBody(toFetch[i]);

        if (i < toFetch.length - 1) {
          await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
        }
      }
    })();

    return () => { cancelled = true; };
  }, [visibleMessageIds, selectedId, userId, fetchBody]);
}
