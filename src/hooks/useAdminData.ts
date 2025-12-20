/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ GOLDEN BRIDGE HOOK - Admin Domain                                │
│  /src/hooks/useAdminData.ts                                            │
│                                                                        │
│  TTTS-2 COMPLIANT: Reads from FUSE only.                              │
│  NO useQuery here - sync happens in useAdminSync().                   │
│                                                                        │
│  Usage:                                                                │
│  const { data, computed, flags } = useAdminData();                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useMemo } from 'react';
import { useFuse } from '@/store/fuse';

/**
 * Golden Bridge Hook - Admin Domain
 *
 * TTTS-2 COMPLIANT:
 * - Reads from FUSE store ONLY
 * - NO useQuery (sync happens in useAdminSync)
 * - Components get data through this hook
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useAdminData();
 * const { users, deletionLogs } = data;
 * ```
 */
export function useAdminData() {
  const admin = useFuse((state) => state.admin);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = admin.status === 'hydrated';

  // Memoize computed object to prevent new reference on every render
  const computed = useMemo(() => ({
    usersCount: admin.users.length,
    deletionLogsCount: admin.deletionLogs.length,
    clerkRegistryCount: admin.clerkRegistryCount,
    hasUsers: admin.users.length > 0,
    hasDeletionLogs: admin.deletionLogs.length > 0,
  }), [admin.users.length, admin.deletionLogs.length, admin.clerkRegistryCount]);

  return {
    // DATA: Raw domain data (from FUSE)
    data: {
      users: admin.users,
      deletionLogs: admin.deletionLogs,
    },

    // COMPUTED: Calculated values from data
    computed,

    // ACTIONS: Mutations and operations (add as needed)
    actions: {
      // Future: Add mutations here
    },

    // FLAGS: Hydration and state flags
    flags: {
      isHydrated,
      isLoading: admin.status === 'loading',
    },
  };
}
