/**
 * ══════════════════════════════════════════════════════════════════════════════
 * EMAIL BODY CACHE SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Infrastructure for managing large email body blobs with LRU eviction.
 * Separated from productivity domain slice for single responsibility.
 *
 * This slice manages:
 * - emailBodies: Record<messageId, htmlContent> - Cached HTML blobs
 * - emailBodyStatus: Per-message fetch status (loading/loaded/rate_limited/error)
 * - emailBodyOrder: LRU tracking for memory-bound eviction
 *
 * THE PATTERN:
 * - Productivity domain handles messages, folders, read status
 * - This slice handles body blob caching (infrastructure concern)
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Per-message body fetch status (idle = never requested) */
export type EmailBodyStatus = 'loading' | 'loaded' | 'rate_limited' | 'error';

/** Email body cache slice - infrastructure state */
export interface EmailBodyCacheSlice {
  /** Cached email bodies (keyed by messageId) */
  emailBodies: Record<string, string>;
  /** Per-message fetch status */
  emailBodyStatus: Record<string, EmailBodyStatus>;
  /** LRU order tracking (oldest first, newest last) */
  emailBodyOrder: string[];
}

/** Email body cache actions */
export interface EmailBodyCacheActions {
  /** Hydrate email body with LRU eviction */
  hydrateEmailBody: (messageId: string, htmlContent: string) => void;
  /** Set/clear body fetch status */
  setEmailBodyStatus: (messageId: string, status: EmailBodyStatus | null) => void;
  /** Clear body cache for specific messages (cleanup on delete) */
  clearBodiesForMessages: (messageIds: string[]) => void;
  /** Reset entire body cache */
  clearEmailBodyCache: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** LRU cap for email bodies (memory bound) */
export const EMAIL_BODY_LRU_CAP = 50;

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

export const initialEmailBodyCacheState: EmailBodyCacheSlice = {
  emailBodies: {},
  emailBodyStatus: {},
  emailBodyOrder: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createEmailBodyCacheSlice: StateCreator<
  EmailBodyCacheSlice & EmailBodyCacheActions,
  [],
  [],
  EmailBodyCacheSlice & EmailBodyCacheActions
> = (set) => ({
  ...initialEmailBodyCacheState,

  hydrateEmailBody: (messageId, htmlContent) => {
    set((state) => {
      const bodies = { ...state.emailBodies };
      const order = [...state.emailBodyOrder];

      // If already cached, remove from order (will re-add at end = touch)
      const existingIdx = order.indexOf(messageId);
      if (existingIdx !== -1) order.splice(existingIdx, 1);

      // Evict oldest if at cap
      while (order.length >= EMAIL_BODY_LRU_CAP) {
        const oldest = order.shift();
        if (oldest) delete bodies[oldest];
      }

      // Add new body at end (most recently used)
      bodies[messageId] = htmlContent;
      order.push(messageId);

      return { emailBodies: bodies, emailBodyOrder: order };
    });
  },

  setEmailBodyStatus: (messageId, status) => {
    set((state) => {
      const newStatus = { ...state.emailBodyStatus };
      if (status === null) {
        delete newStatus[messageId];
      } else {
        newStatus[messageId] = status;
      }
      return { emailBodyStatus: newStatus };
    });
  },

  clearBodiesForMessages: (messageIds) => {
    set((state) => {
      const idsSet = new Set(messageIds);
      const bodies = { ...state.emailBodies };
      const status = { ...state.emailBodyStatus };

      for (const id of messageIds) {
        delete bodies[id];
        delete status[id];
      }

      return {
        emailBodies: bodies,
        emailBodyStatus: status,
        emailBodyOrder: state.emailBodyOrder.filter((id) => !idsSet.has(id)),
      };
    });
  },

  clearEmailBodyCache: () => {
    set(initialEmailBodyCacheState);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type EmailBodyCacheStore = EmailBodyCacheSlice & EmailBodyCacheActions;
