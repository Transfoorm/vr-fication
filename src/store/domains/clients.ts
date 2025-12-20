/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CLIENTS DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: contacts, teams, sessions, reports
 * Route: /app/domains/clients/*
 * Backend: /convex/domains/clients/
 * Access: All ranks (scoped by rank)
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

export interface ClientsData {
  contacts: Record<string, unknown>[];
  teams: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
  reports: Record<string, unknown>[];
}

export interface ClientsSlice extends ClientsData {
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ClientsActions {
  hydrateClients: (data: Partial<ClientsData>, source?: ADPSource) => void;
  clearClients: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialClientsState: ClientsSlice = {
  contacts: [],
  teams: [],
  sessions: [],
  reports: [],
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createClientsSlice: StateCreator<
  ClientsSlice & ClientsActions,
  [],
  [],
  ClientsSlice & ClientsActions
> = (set) => ({
  ...initialClientsState,

  hydrateClients: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateClients');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`👥 FUSE: Clients domain hydrated via ${source}`, {
        contacts: data.contacts?.length || 0,
        teams: data.teams?.length || 0,
        sessions: data.sessions?.length || 0,
        reports: data.reports?.length || 0,
      });
    }
    fuseTimer.end('hydrateClients', start);
  },

  clearClients: () => {
    const start = fuseTimer.start('clearClients');
    set(initialClientsState);
    fuseTimer.end('clearClients', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type ClientsStore = ClientsSlice & ClientsActions;
