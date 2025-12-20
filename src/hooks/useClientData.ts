/**──────────────────────────────────────────────────────────────────────┐
│  👥 WRAP HOOK - Clients Domain                                         │
│  /src/hooks/useClientData.ts                                           │
│                                                                        │
│  WRAP Pattern: { data, computed, actions, flags }                      │
│  Clean API for accessing clients domain data                           │
│  Following FUSE Stack architectural contract                           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * WRAP Hook - Clients Domain
 *
 * Returns structured object following WRAP contract:
 * - data: Raw domain data from FUSE store
 * - computed: Calculated/derived values
 * - actions: Mutations and operations (future)
 * - flags: Status indicators (hydration, loading, etc.)
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useClientData();
 * const { contacts, teams, sessions } = data;
 * const { totalContacts } = computed;
 * const { isHydrated } = flags;
 * ```
 */
export function useClientData() {
  const clients = useFuse((state) => state.clients);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = clients.status === 'hydrated';

  return {
    // DATA: Raw domain data from FUSE store
    data: {
      contacts: clients.contacts,
      teams: clients.teams,
      sessions: clients.sessions,
      reports: clients.reports,
    },

    // COMPUTED: Calculated/derived values
    computed: {
      totalContacts: clients.contacts.length,
      totalTeams: clients.teams.length,
      totalSessions: clients.sessions.length,
      totalReports: clients.reports.length,
      hasData: clients.contacts.length > 0 || clients.teams.length > 0 || clients.sessions.length > 0,
    },

    // ACTIONS: Mutations and operations
    // Future: Convex mutations wrapped as actions
    actions: {},

    // FLAGS: Status indicators
    flags: {
      isHydrated,
      isOnline: true, // WARP ensures data always available
    },
  };
}

// Type export for components
export type ClientData = ReturnType<typeof useClientData>;
