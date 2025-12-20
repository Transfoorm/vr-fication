/**──────────────────────────────────────────────────────────────────────┐
│  🔄 ADMIN SYNC HOOK - Convex → FUSE Bridge                           │
│  /src/hooks/useAdminSync.ts                                           │
│                                                                        │
│  TTTS-2 COMPLIANT: useQuery ONLY hydrates FUSE.                       │
│  This hook syncs Convex data INTO FUSE - never returns directly.      │
│                                                                        │
│  Used by: AdminProvider                                                │
│  Components read via: useAdminData()                                  │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';

/**
 * Admin Sync Hook - Convex → FUSE
 *
 * GOLDEN BRIDGE PATTERN:
 * - Subscribes to Convex via useQuery
 * - Hydrates FUSE store via hydrateAdmin()
 * - Returns NOTHING (void)
 * - Components read from FUSE via useAdminData()
 */
export function useAdminSync(): void {
  const hydrateAdmin = useFuse((state) => state.hydrateAdmin);
  const adminStatus = useFuse((state) => state.admin.status);
  const user = useFuse((state) => state.user);

  // 🛡️ S.I.D. Phase 15: Pass callerUserId (sovereign) to queries
  const callerUserId = user?.id as Id<"admin_users"> | undefined;

  // Convex WebSocket subscription for real-time updates
  const liveUsers = useQuery(
    api.domains.admin.users.api.getAllUsers,
    callerUserId ? { callerUserId } : "skip"
  );
  const liveDeletionLogs = useQuery(
    api.domains.admin.users.api.getAllDeletionLogs,
    callerUserId ? { callerUserId } : "skip"
  );
  const liveClerkRegistryCount = useQuery(
    api.domains.admin.users.api.getClerkRegistryCount,
    callerUserId ? { callerUserId } : "skip"
  );

  // SYNC TO FUSE: When Convex data arrives, hydrate FUSE store
  useEffect(() => {
    if (liveUsers && liveDeletionLogs && liveClerkRegistryCount !== undefined) {
      hydrateAdmin({
        users: liveUsers,
        deletionLogs: liveDeletionLogs,
        clerkRegistryCount: liveClerkRegistryCount
      }, 'CONVEX_LIVE');
      console.log('🛡️ ADMIN SYNC: Data synced to FUSE via CONVEX_LIVE');
    }
  }, [liveUsers, liveDeletionLogs, liveClerkRegistryCount, hydrateAdmin]);

  // Log initial hydration status
  useEffect(() => {
    if (adminStatus === 'hydrated') {
      console.log('🛡️ ADMIN SYNC: FUSE store is hydrated');
    }
  }, [adminStatus]);
}
