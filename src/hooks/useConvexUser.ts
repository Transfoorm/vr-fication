/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.0 - SINGLE SOURCE OF IDENTITY                      │
│  /src/hooks/useConvexUser.ts                                             │
│                                                                            │
│  GOLDEN BRIDGE COMPLIANT (TTTS-2):                                        │
│  - useQuery ONLY hydrates FUSE                                            │
│  - Components read from FUSE only                                         │
│  - NO direct Convex data returns                                          │
│                                                                            │
│  VANISH LAW:                                                               │
│  "There is only one identity: the Convex user._id.                        │
│   Clerk authenticates — Convex governs.                                   │
│   No component shall accept userId as prop."                              │
│                                                                            │
│  TTT CERTIFIED: Single source prevents identity confusion at scale        │
└──────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useFuse } from "@/store/fuse";
import type { FuseUser } from "@/store/types";

/**
 * 🛑 FUSE VIRUS QUARANTINE - useConvexUserSync DISABLED
 *
 * This hook was a FUSE VIRUS - it constantly overwrote cookie-hydrated
 * data with Convex WebSocket data, causing race conditions and
 * breaking image URLs (brandLogoUrl, avatarUrl).
 *
 * FUSE PHILOSOPHY:
 * - Cookie is the single source of truth
 * - Server Actions update DB AND cookie atomically
 * - No WebSocket polling needed for user data
 *
 * ORPHAN DETECTION moved to middleware (where it belongs).
 */
export function useConvexUserSync(): void {
  // 🛑 DISABLED - This was overwriting cookie data with stale Convex data
  // Cookie hydration in ClientHydrator is the single source of truth
  //
  // If you need to update user data:
  // 1. Call a Server Action (updates DB + cookie atomically)
  // 2. Cookie change triggers ClientHydrator refresh
  // 3. FUSE store updates from cookie
  //
  // NO CONVEX LIVE QUERIES FOR USER DATA
}

/**
 * USE CONVEX USER - GOLDEN BRIDGE COMPLIANT
 *
 * Reads user from FUSE store (not Convex directly).
 * Use useConvexUserSync() in a provider to keep FUSE hydrated.
 *
 * @returns FUSE user or null
 *
 * USAGE:
 * ```tsx
 * const user = useConvexUser();
 * if (!user) return <Loading />;
 * return <div>{user.email}</div>;
 * ```
 */
export function useConvexUser(): FuseUser {
  return useFuse((state) => state.user);
}

/**
 * USE CONVEX USER (REQUIRED)
 *
 * Variant that throws if user is not in FUSE.
 * Use in components that require authentication.
 *
 * @returns FUSE user document (never null)
 * @throws Error if not authenticated or user not found
 */
export function useConvexUserRequired(): NonNullable<FuseUser> {
  const user = useConvexUser();

  if (!user) {
    throw new Error(
      "[VANISH] User not in FUSE store - ensure useConvexUserSync() is running in a provider"
    );
  }

  return user;
}

/**
 * USE USER ID
 *
 * Convenience hook for when you only need the user ID.
 * Reads from FUSE (Golden Bridge compliant).
 *
 * @returns FUSE user._id or undefined
 */
export function useUserId() {
  const user = useConvexUser();
  return user?.id;
}

/**
 * USE USER RANK
 *
 * Convenience hook for rank-based UI gating.
 * Reads from FUSE (Golden Bridge compliant).
 *
 * @returns User rank or null
 */
export function useUserRankFromConvex() {
  const user = useConvexUser();
  return user?.rank ?? null;
}

/**
 * IS USER RANK
 *
 * Check if user has specific rank(s).
 * Reads from FUSE (Golden Bridge compliant).
 *
 * @param ranks - Single rank or array of acceptable ranks
 * @returns true if user has one of the specified ranks
 */
export function useIsUserRank(ranks: string | string[]): boolean {
  const user = useConvexUser();
  if (!user?.rank) return false;

  const allowedRanks = Array.isArray(ranks) ? ranks : [ranks];
  return allowedRanks.includes(user.rank);
}
