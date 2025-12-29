/**─────────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL PREFETCH HOOK - Latency Elimination Engine                          │
│  /src/hooks/useEmailPrefetch.ts                                                │
│                                                                                 │
│  DOCTRINE (Prefetch Doctrine from STORAGE-LIFECYCLE-DOCTRINE.md):             │
│  - Hover: 300ms dwell on email row triggers prefetch                          │
│  - Keyboard focus: Arrow-key navigation triggers prefetch                     │
│  - Selection: Single-click (highlight) triggers prefetch                      │
│  - Viewport: Top N visible emails prefetch on list render                     │
│                                                                                 │
│  Prefetch is:                                                                  │
│  - Silent (no UI indication)                                                   │
│  - Non-blocking (fails silently if network slow)                              │
│  - Rate-limited (max 5 concurrent prefetch requests)                          │
│  - Cache-populating (prefetched bodies enter the ring buffer if enabled)      │
│                                                                                 │
│  See: /docs/EMAIL-BODY-CACHE-IMPLEMENTATION.md                                 │
└───────────────────────────────────────────────────────────────────────────────*/

'use client';

import { useCallback, useRef } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';

const MAX_CONCURRENT = 5;
const HOVER_DELAY_MS = 300;

type MessageId = Id<'productivity_email_Index'>;

interface PrefetchState {
  /** Currently in-flight prefetch requests */
  inFlight: Set<string>;
  /** Successfully completed prefetches (in memory) */
  completed: Set<string>;
  /** Pending hover timeout */
  hoverTimeout: NodeJS.Timeout | null;
}

export interface UseEmailPrefetchReturn {
  /**
   * Call when mouse enters an email row.
   * Starts 300ms timer before prefetch.
   */
  onHover: (messageId: MessageId) => void;

  /**
   * Call when mouse leaves an email row.
   * Cancels pending hover timer.
   */
  onHoverEnd: () => void;

  /**
   * Call when email row receives keyboard focus.
   * Immediate prefetch (no delay).
   */
  onFocus: (messageId: MessageId) => void;

  /**
   * Call when email row is selected (clicked).
   * Immediate prefetch (no delay).
   */
  onSelect: (messageId: MessageId) => void;

  /**
   * Call with visible message IDs when viewport changes.
   * Prefetches first N visible emails.
   */
  prefetchViewport: (messageIds: MessageId[]) => void;

  /**
   * Check if a body is already prefetched (in memory).
   */
  isCached: (messageId: MessageId) => boolean;
}

/**
 * EMAIL PREFETCH MANAGER
 *
 * Silently fetches email bodies before user clicks.
 * Populates cache for instant opens.
 *
 * This is the "secret weapon" that makes email feel instant:
 * - Hover for 300ms → body is fetched in background
 * - Arrow key to email → body is fetched immediately
 * - By the time user clicks, body is already there
 */
export function useEmailPrefetch(): UseEmailPrefetchReturn {
  const user = useFuse((state) => state.user);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  const getBody = useAction(api.productivity.email.bodyCache.getEmailBody);

  // Use ref to persist state across renders without triggering re-renders
  const state = useRef<PrefetchState>({
    inFlight: new Set(),
    completed: new Set(),
    hoverTimeout: null,
  });

  /**
   * Core prefetch function
   *
   * - Silent: No UI feedback
   * - Rate-limited: Max 5 concurrent
   * - Deduplicated: Won't refetch completed/in-flight
   */
  const prefetch = useCallback(async (messageId: MessageId) => {
    if (!userId) return;

    const s = state.current;
    const idStr = messageId as string;

    // Skip if already done or in progress
    if (s.completed.has(idStr) || s.inFlight.has(idStr)) {
      return;
    }

    // Skip if at concurrency limit
    if (s.inFlight.size >= MAX_CONCURRENT) {
      return;
    }

    s.inFlight.add(idStr);

    try {
      await getBody({ userId, messageId });
      s.completed.add(idStr);
    } catch {
      // Prefetch failure is silent - user will just wait when they click
    } finally {
      s.inFlight.delete(idStr);
    }
  }, [userId, getBody]);

  /**
   * Handle hover intent (with delay)
   *
   * Waits 300ms before prefetching to avoid spam during quick mouse movement.
   */
  const onHover = useCallback((messageId: MessageId) => {
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
   *
   * When user arrows to an email, prefetch immediately.
   */
  const onFocus = useCallback((messageId: MessageId) => {
    prefetch(messageId);
  }, [prefetch]);

  /**
   * Handle selection (immediate)
   *
   * When user clicks an email, prefetch immediately.
   * (Body may already be fetched from hover/focus)
   */
  const onSelect = useCallback((messageId: MessageId) => {
    prefetch(messageId);
  }, [prefetch]);

  /**
   * Prefetch visible viewport
   *
   * Call with array of visible message IDs when viewport changes.
   * Prefetches first 5 visible emails.
   */
  const prefetchViewport = useCallback((messageIds: MessageId[]) => {
    // Prefetch first N visible
    const toPrefetch = messageIds.slice(0, 5);
    toPrefetch.forEach(prefetch);
  }, [prefetch]);

  /**
   * Check if body is already cached/prefetched
   *
   * Note: This only checks in-memory state from this session.
   * Convex cache hits are handled server-side.
   */
  const isCached = useCallback((messageId: MessageId) => {
    return state.current.completed.has(messageId as string);
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
