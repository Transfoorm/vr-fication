/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SYSTEM DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: AI configuration, user management, rank management
 * Route: /app/domains/system/*
 * Backend: /convex/domains/system/
 * Access: Admiral only
 *
 * ADP/PRISM Compliant: Full coordination fields for WARP preloading
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SystemData {
  users: Record<string, unknown>[];
  ranks: Record<string, unknown>[];
  aiConfig: Record<string, unknown> | null;
}

export interface SystemSlice extends SystemData {
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface SystemActions {
  hydrateSystem: (data: Partial<SystemData>, source?: ADPSource) => void;
  clearSystem: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialSystemState: SystemSlice = {
  users: [],
  ranks: [],
  aiConfig: null,
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createSystemSlice: StateCreator<
  SystemSlice & SystemActions,
  [],
  [],
  SystemSlice & SystemActions
> = (set) => ({
  ...initialSystemState,

  hydrateSystem: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateSystem');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 FUSE: System domain hydrated via ${source}`, {
        users: data.users?.length || 0,
        ranks: data.ranks?.length || 0,
        aiConfig: data.aiConfig ? 'present' : 'none',
      });
    }
    fuseTimer.end('hydrateSystem', start);
  },

  clearSystem: () => {
    const start = fuseTimer.start('clearSystem');
    set(initialSystemState);
    fuseTimer.end('clearSystem', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type SystemStore = SystemSlice & SystemActions;
