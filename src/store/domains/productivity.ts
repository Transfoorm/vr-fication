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
  // LRU order tracking (oldest first, newest last)
  emailBodyOrder: string[];
  // UI preferences (persisted)
  emailViewMode: EmailViewMode;
  // Pending read status updates (skip sync for these messages)
  pendingReadUpdates: Set<string>;
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ProductivityActions {
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
  hydrateEmailBody: (messageId: string, htmlContent: string) => void;
  updateEmailReadStatus: (messageId: string, isRead: boolean) => void;
  clearPendingReadUpdate: (messageId: string) => void;
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
  // LRU order (oldest first)
  emailBodyOrder: [],
  // UI preferences
  emailViewMode: 'live', // Default to Live mode (traditional Outlook-style)
  // Pending read status updates (protected from sync overwrite)
  pendingReadUpdates: new Set(),
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
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
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
      return { ...state, pendingReadUpdates: newPending };
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
