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
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ProductivityActions {
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
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
