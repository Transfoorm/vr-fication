/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PRODUCTIVITY DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: email, calendar, meetings, bookings, tasks
 * Route: /app/domains/productivity/*
 * Backend: /convex/domains/productivity/
 *
 * ADP/PRISM Compliant: Full coordination fields for WARP preloading
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';
import type { ProductivityEmail } from '@/features/productivity/email-console/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type EmailViewMode = 'live' | 'impact';

// Per-message body fetch status (idle = never requested)
export type EmailBodyStatus = 'loading' | 'loaded' | 'rate_limited' | 'error';

export interface ProductivityData {
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  // Email bodies are hydrated on-demand (large HTML blobs)
  emailBodies?: Record<string, string>;
}

// LRU cap for email bodies (memory bound)
const EMAIL_BODY_LRU_CAP = 50;

export interface ProductivitySlice {
  // Domain data
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  // Email bodies (hydrated on-demand, keyed by messageId)
  emailBodies: Record<string, string>;
  // Email body fetch status (per-message: loading/loaded/rate_limited/error)
  emailBodyStatus: Record<string, EmailBodyStatus>;
  // LRU order tracking (oldest first, newest last)
  emailBodyOrder: string[];
  // UI preferences (persisted)
  emailViewMode: EmailViewMode;
  // Pending read status updates (skip sync for these messages)
  pendingReadUpdates: Set<string>;
  // Auto-mark exempt IDs (never auto-mark these again this session)
  autoMarkExemptIds: Set<string>;
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ProductivityActions {
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
  hydrateEmailBody: (messageId: string, htmlContent: string) => void;
  setEmailBodyStatus: (messageId: string, status: EmailBodyStatus | null) => void;
  updateEmailReadStatus: (messageId: string, isRead: boolean) => void;
  batchUpdateEmailReadStatus: (messageIds: string[], isRead: boolean) => void;
  clearPendingReadUpdate: (messageId: string) => void;
  batchClearPendingReadUpdates: (messageIds: string[]) => void;
  addAutoMarkExempt: (messageId: string) => void;
  addAutoMarkExemptBatch: (messageIds: string[]) => void;
  removeAutoMarkExempt: (messageId: string) => void;
  removeAutoMarkExemptBatch: (messageIds: string[]) => void;
  clearProductivity: () => void;
  setEmailViewMode: (mode: EmailViewMode) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialProductivityState: ProductivitySlice = {
  email: undefined,
  calendar: [],
  meetings: [],
  bookings: [],
  tasks: [],
  // Email bodies (on-demand hydration)
  emailBodies: {},
  // Email body fetch status (per-message)
  emailBodyStatus: {},
  // LRU order (oldest first)
  emailBodyOrder: [],
  // UI preferences
  emailViewMode: 'live', // Default to Live mode (traditional Outlook-style)
  // Pending read status updates (protected from sync overwrite)
  pendingReadUpdates: new Set(),
  // Auto-mark exempt IDs
  autoMarkExemptIds: new Set(),
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createProductivitySlice: StateCreator<
  ProductivitySlice & ProductivityActions,
  [],
  [],
  ProductivitySlice & ProductivityActions
> = (set) => ({
  ...initialProductivityState,

  hydrateProductivity: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateProductivity');
    set((state) => {
      // CRITICAL: Preserve isRead status for messages with pending updates
      // This prevents Convex live queries from overwriting optimistic UI updates
      let finalEmail = data.email;
      let protectedCount = 0;

      const pendingSize = state.pendingReadUpdates.size;
      const pendingIds = [...state.pendingReadUpdates].map(id => id.slice(-8)).join(', ');

      // UNCONDITIONAL log to trace hydration calls
      if (process.env.NODE_ENV === 'development') {
        console.log(`🌊 HYDRATE from ${source}: ${data.email?.messages?.length ?? 0} msgs, pending=${pendingSize} [${pendingIds}]`);
      }

      if (data.email?.messages && pendingSize > 0) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🛡️ Checking protection: ${pendingSize} pending updates`);
        }
        const protectedMessages = data.email.messages.map((msg) => {
          if (state.pendingReadUpdates.has(msg._id)) {
            // Find current local state for this message
            const localMsg = state.email?.messages?.find((m) => m._id === msg._id);
            if (localMsg) {
              if (localMsg.isRead !== msg.isRead) {
                // Server has stale data - preserve local isRead
                protectedCount++;
                if (process.env.NODE_ENV === 'development') {
                  console.log(`🛡️ Protected ${msg._id.slice(-8)}: local=${localMsg.isRead}, server=${msg.isRead}`);
                }
                return { ...msg, isRead: localMsg.isRead };
              } else if (process.env.NODE_ENV === 'development') {
                console.log(`🛡️ No conflict ${msg._id.slice(-8)}: both=${localMsg.isRead}`);
              }
            }
          }
          return msg;
        });
        finalEmail = { ...data.email, messages: protectedMessages };

        if (protectedCount > 0 && process.env.NODE_ENV === 'development') {
          console.log(`🛡️ FUSE: Protected ${protectedCount} messages from stale sync`);
        }
      }

      return {
        ...state,
        ...data,
        email: finalEmail,
        status: 'hydrated',
        lastFetchedAt: Date.now(),
        source,
      };
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ FUSE: Productivity domain hydrated via ${source}`, {
        email: data.email ? `${data.email.threads?.length || 0} threads, ${data.email.messages?.length || 0} messages` : 'none',
        calendar: data.calendar?.length || 0,
        meetings: data.meetings?.length || 0,
        bookings: data.bookings?.length || 0,
      });
    }
    fuseTimer.end('hydrateProductivity', start);
  },

  updateEmailReadStatus: (messageId, isRead) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const updatedMessages = state.email.messages.map((msg) =>
        msg._id === messageId ? { ...msg, isRead } : msg
      );

      // Add to pending set to protect from sync overwrite
      const newPending = new Set(state.pendingReadUpdates);
      newPending.add(messageId);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 PENDING ADD: ${messageId.slice(-8)} (now ${newPending.size} pending)`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: updatedMessages,
        },
        pendingReadUpdates: newPending,
      };
    });
  },

  clearPendingReadUpdate: (messageId) => {
    set((state) => {
      const newPending = new Set(state.pendingReadUpdates);
      newPending.delete(messageId);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔓 PENDING CLEAR: ${messageId.slice(-8)} (now ${newPending.size} pending)`);
      }
      return { ...state, pendingReadUpdates: newPending };
    });
  },

  // BATCH: Single state update for N messages (scales to 1000+)
  batchUpdateEmailReadStatus: (messageIds, isRead) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const idsSet = new Set(messageIds);
      const updatedMessages = state.email.messages.map((msg) =>
        idsSet.has(msg._id) ? { ...msg, isRead } : msg
      );

      // Add all to pending set
      const newPending = new Set(state.pendingReadUpdates);
      for (const id of messageIds) {
        newPending.add(id);
      }

      if (process.env.NODE_ENV === 'development') {
        const ids = messageIds.map(id => id.slice(-8)).join(', ');
        console.log(`🔒 PENDING BATCH ADD: [${ids}] (now ${newPending.size} pending)`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: updatedMessages,
        },
        pendingReadUpdates: newPending,
      };
    });
  },

  // BATCH: Clear multiple pending updates at once
  batchClearPendingReadUpdates: (messageIds) => {
    set((state) => {
      const newPending = new Set(state.pendingReadUpdates);
      for (const id of messageIds) {
        newPending.delete(id);
      }
      if (process.env.NODE_ENV === 'development') {
        const ids = messageIds.map(id => id.slice(-8)).join(', ');
        console.log(`🔓 PENDING BATCH CLEAR: [${ids}] (now ${newPending.size} pending)`);
      }
      return { ...state, pendingReadUpdates: newPending };
    });
  },

  // Auto-mark exempt: prevents auto-mark-as-read for these IDs this session
  addAutoMarkExempt: (messageId) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      newExempt.add(messageId);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  addAutoMarkExemptBatch: (messageIds) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      for (const id of messageIds) {
        newExempt.add(id);
      }
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  removeAutoMarkExempt: (messageId) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      newExempt.delete(messageId);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  removeAutoMarkExemptBatch: (messageIds) => {
    set((state) => {
      const newExempt = new Set(state.autoMarkExemptIds);
      for (const id of messageIds) newExempt.delete(id);
      return { ...state, autoMarkExemptIds: newExempt };
    });
  },

  hydrateEmailBody: (messageId, htmlContent) => {
    set((state) => {
      const bodies = { ...state.emailBodies };
      const order = [...state.emailBodyOrder];

      // If already cached, remove from order (will re-add at end = touch)
      const existingIdx = order.indexOf(messageId);
      if (existingIdx !== -1) {
        order.splice(existingIdx, 1);
      }

      // Evict oldest if at cap (evict AFTER successful hydrate)
      while (order.length >= EMAIL_BODY_LRU_CAP) {
        const oldest = order.shift();
        if (oldest) delete bodies[oldest];
      }

      // Add new body at end (most recently used)
      bodies[messageId] = htmlContent;
      order.push(messageId);

      return {
        ...state,
        emailBodies: bodies,
        emailBodyOrder: order,
      };
    });
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ FUSE: Email body hydrated for ${messageId.slice(-8)} (cache: ${EMAIL_BODY_LRU_CAP} cap)`);
    }
  },

  setEmailBodyStatus: (messageId, status) => {
    set((state) => {
      const newStatus = { ...state.emailBodyStatus };
      if (status === null) {
        delete newStatus[messageId];
      } else {
        newStatus[messageId] = status;
      }
      return { ...state, emailBodyStatus: newStatus };
    });
  },

  clearProductivity: () => {
    const start = fuseTimer.start('clearProductivity');
    set(initialProductivityState);
    fuseTimer.end('clearProductivity', start);
  },

  setEmailViewMode: (mode) => {
    set((state) => ({
      ...state,
      emailViewMode: mode,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ FUSE: Email view mode changed to ${mode}`);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type ProductivityStore = ProductivitySlice & ProductivityActions;
