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
 *
 * NOTE: Email body caching (LRU, status) is in ./emailBodyCache.ts
 * This file handles domain logic: messages, folders, read status, optimistic deletes
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

export interface ProductivityData {
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
}

export interface ProductivitySlice {
  // Domain data
  email?: ProductivityEmail;
  calendar: Record<string, unknown>[];
  meetings: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
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
  updateEmailReadStatus: (messageId: string, isRead: boolean) => void;
  batchUpdateEmailReadStatus: (messageIds: string[], isRead: boolean) => void;
  removeEmailMessages: (messageIds: string[]) => void;
  removeEmailFolder: (folderId: string) => void;
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

  // OPTIMISTIC DELETE: Instantly remove messages from UI (API fires in background)
  // Note: Body cache cleanup is handled by fuse.ts which has access to both slices
  removeEmailMessages: (messageIds) => {
    set((state) => {
      if (!state.email?.messages) return state;

      const idsSet = new Set(messageIds);
      const filteredMessages = state.email.messages.filter((msg) => !idsSet.has(msg._id));

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ FUSE: Removed ${messageIds.length} messages from UI`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          messages: filteredMessages,
        },
      };
    });
  },

  // OPTIMISTIC DELETE: Instantly remove folder from UI (API fires in background)
  removeEmailFolder: (folderId) => {
    set((state) => {
      if (!state.email?.folders) return state;

      const filteredFolders = state.email.folders.filter((f) => f.externalFolderId !== folderId);

      if (process.env.NODE_ENV === 'development') {
        console.log(`🗑️ FUSE: Removed folder ${folderId.slice(-8)} from UI`);
      }

      return {
        ...state,
        email: {
          ...state.email,
          folders: filteredFolders,
        },
      };
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
