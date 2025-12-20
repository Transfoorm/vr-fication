/**──────────────────────────────────────────────────────────────────────┐
│  🔄 USER SYNC PROVIDER - GOLDEN BRIDGE COMPLIANT                     │
│  /src/providers/UserSyncProvider.tsx                                  │
│                                                                        │
│  TTTS-2: Syncs Convex user data INTO FUSE store.                      │
│  Components read from FUSE only - never directly from Convex.         │
│                                                                        │
│  This provider MUST be mounted in the app layout to enable            │
│  real-time user data sync from Convex → FUSE.                         │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useConvexUserSync } from '@/hooks/useConvexUser';

/**
 * UserSyncProvider - Golden Bridge User Sync
 *
 * Runs useConvexUserSync() which:
 * - Subscribes to Convex user data via useQuery
 * - Hydrates FUSE store via setUser()
 * - NEVER returns data directly to components
 *
 * Components use useConvexUser() which reads from FUSE only.
 */
export function UserSyncProvider() {
  useConvexUserSync();
  return null;
}
