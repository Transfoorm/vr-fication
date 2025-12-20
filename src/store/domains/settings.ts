/**
 * ══════════════════════════════════════════════════════════════════════════════
 * SETTINGS DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: user profile, preferences, notifications
 * Route: /app/domains/settings/*
 * Backend: /convex/domains/settings/
 * Access: All ranks (SELF-scoped - unique!)
 *
 * ADP/PRISM Compliant: Full coordination fields for WARP preloading
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';
import type { FuseUser } from '@/store/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SettingsData {
  userProfile: FuseUser;
  preferences: Record<string, unknown>[];
  notifications: Record<string, unknown>[];
}

export interface SettingsSlice extends SettingsData {
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface SettingsActions {
  hydrateSettings: (data: Partial<SettingsData>, source?: ADPSource) => void;
  clearSettings: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialSettingsState: SettingsSlice = {
  userProfile: null,
  preferences: [],
  notifications: [],
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createSettingsSlice: StateCreator<
  SettingsSlice & SettingsActions,
  [],
  [],
  SettingsSlice & SettingsActions
> = (set) => ({
  ...initialSettingsState,

  hydrateSettings: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateSettings');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚙️ FUSE: Settings domain hydrated via ${source}`, {
        userProfile: data.userProfile ? 'present' : 'none',
        preferences: data.preferences?.length || 0,
        notifications: data.notifications?.length || 0,
      });
    }
    fuseTimer.end('hydrateSettings', start);
  },

  clearSettings: () => {
    const start = fuseTimer.start('clearSettings');
    set(initialSettingsState);
    fuseTimer.end('clearSettings', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type SettingsStore = SettingsSlice & SettingsActions;
