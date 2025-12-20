/**
 * ══════════════════════════════════════════════════════════════════════════════
 * ADMIN DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: user management, deletion logs, admin operations
 * Route: /app/domains/admin/*
 * Backend: /convex/domains/admin/
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

export interface AdminData {
  users: Record<string, unknown>[];
  deletionLogs: Record<string, unknown>[];
  clerkRegistryCount?: number;
}

export interface AdminSlice {
  // Domain data
  users: Record<string, unknown>[];
  deletionLogs: Record<string, unknown>[];
  clerkRegistryCount: number;
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface AdminActions {
  hydrateAdmin: (data: Partial<AdminData>, source?: ADPSource) => void;
  clearAdmin: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialAdminState: AdminSlice = {
  users: [],
  deletionLogs: [],
  clerkRegistryCount: 0,
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createAdminSlice: StateCreator<
  AdminSlice & AdminActions,
  [],
  [],
  AdminSlice & AdminActions
> = (set) => ({
  ...initialAdminState,

  hydrateAdmin: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateAdmin');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛡️ FUSE: Admin domain hydrated via ${source}`, {
        users: data.users?.length || 0,
        deletionLogs: data.deletionLogs?.length || 0,
        clerkRegistryCount: data.clerkRegistryCount ?? 0,
      });
    }
    fuseTimer.end('hydrateAdmin', start);
  },

  clearAdmin: () => {
    const start = fuseTimer.start('clearAdmin');
    set(initialAdminState);
    fuseTimer.end('clearAdmin', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type AdminStore = AdminSlice & AdminActions;
