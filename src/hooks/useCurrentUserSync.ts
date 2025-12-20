/**──────────────────────────────────────────────────────────────────────┐
│  🔄 CURRENT USER SYNC HOOK                                            │
│  /src/hooks/useCurrentUserSync.ts                                     │
│                                                                        │
│  Real-time sync of current user data from Convex to FUSE store        │
│  Ensures subscription status updates instantly without logout/login   │
│                                                                        │
│  ARCHITECTURE:                                                         │
│  - Convex live query: Real-time updates (WebSocket subscription)      │
│  - Auto-sync: Convex → FUSE store (seamless reactivity)              │
│  - Result: Instant updates when subscription status changes           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

// import { useEffect } from 'react';  // DISABLED during repatriation
// import { useQuery } from 'convex/react';  // DISABLED during repatriation
// import { api } from '@/convex/_generated/api';  // DISABLED during repatriation
// import { useFuse } from '@/store/fuse';  // DISABLED during repatriation

/**
 * Current User Sync Hook
 *
 * Subscribes to real-time updates for the current user's data
 * and syncs critical fields (like subscriptionStatus) to FUSE store
 *
 * Usage: Call this hook once in your root layout or app component
 * ```tsx
 * useCurrentUserSync();
 * ```
 */
export function useCurrentUserSync() {
  // User state selectors - currently unused but reserved for future expansion
  // const clerkId = useFuse((state) => state.user?.clerkId);
  // const subscriptionStatus = useFuse((state) => state.user?.subscriptionStatus);
  // const rank = useFuse((state) => state.user?.rank);
  // const entityName = useFuse((state) => state.user?.entityName);
  // const setupStatus = useFuse((state) => state.user?.setupStatus);
  // const avatarUrl = useFuse((state) => state.user?.avatarUrl);
  // const brandLogoUrl = useFuse((state) => state.user?.brandLogoUrl);
  // const updateUser = useFuse((state) => state.updateUser);

  // 🛑 REPATRIATION: Live query DISABLED
  // User data changes monthly at most - WebSocket subscription is overkill
  // FUSE philosophy: "Every fetch is a failure" - static data needs static loading
  // User data is set at login via cookie and updated via Server Actions when needed
  //
  // const liveUser = useQuery(
  //   api.domains.admin.users.api.getCurrentUser,
  //   clerkId ? { clerkId } : 'skip'
  // );

  // 🛑 AUTO-SYNC DISABLED: No live data to sync
  // If user data needs updating (e.g. after subscription change):
  // 1. Server Action updates database
  // 2. Server Action updates FUSE store directly
  // 3. No polling, no subscriptions, no race conditions
  //
  // useEffect(() => {
  //   if (liveUser) {
  //     // Only sync if data actually changed (avoid unnecessary updates)
  //     const hasChanges =
  //       liveUser.subscriptionStatus !== subscriptionStatus ||
  //       liveUser.rank !== rank ||
  //       liveUser.entityName !== entityName ||
  //       liveUser.setupStatus !== setupStatus ||
  //       liveUser.avatarUrl !== avatarUrl ||
  //       liveUser.brandLogoUrl !== brandLogoUrl;
  //
  //     if (hasChanges) {
  //       console.log('🔄 User data sync: Updating from Convex live query');
  //       console.log('📸 brandLogoUrl from Convex:', liveUser.brandLogoUrl);
  //       console.log('📸 avatarUrl from Convex:', liveUser.avatarUrl);
  //
  //       updateUser({
  //         subscriptionStatus: liveUser.subscriptionStatus,
  //         rank: liveUser.rank,
  //         entityName: liveUser.entityName,
  //         setupStatus: liveUser.setupStatus,
  //         avatarUrl: liveUser.avatarUrl,
  //         brandLogoUrl: liveUser.brandLogoUrl,
  //       });
  //     }
  //   }
  // }, [liveUser, subscriptionStatus, rank, entityName, setupStatus, updateUser]);
}
