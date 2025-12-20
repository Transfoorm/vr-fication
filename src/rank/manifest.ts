/**──────────────────────────────────────────────────────────────────────┐
│  📋 SRS MANIFEST AGGREGATOR - Master Access Control                  │
│  /src/rank/manifest.ts                                                │
│                                                                        │
│  Central manifest registry + helper functions.                        │
│  Single source of truth for all rank-based access control.            │
│                                                                        │
│  SRS Layer 2: Compile-Time Truth                                     │
│  • Aggregates all four rank manifests                                 │
│  • Provides access validation helpers                                 │
│  • Used by Edge Gate (middleware.ts)                                  │
│  • Used by Navigation builders                                        │
│                                                                        │
│  SRS Commandment #2: One Source of Truth                             │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Manifest             │
└────────────────────────────────────────────────────────────────────────┘ */

import type { UserRank, RankManifest, ManifestMap, DomainRoute } from '@/rank/types';
import { ADMIRAL_MANIFEST } from '@/rank/admiral/manifest';
import { COMMODORE_MANIFEST } from '@/rank/commodore/manifest';
import { CAPTAIN_MANIFEST } from '@/rank/captain/manifest';
import { CREW_MANIFEST } from '@/rank/crew/manifest';

/**
 * Master manifest registry (all four ranks)
 */
export const MANIFESTS: ManifestMap = {
  admiral: ADMIRAL_MANIFEST,
  commodore: COMMODORE_MANIFEST,
  captain: CAPTAIN_MANIFEST,
  crew: CREW_MANIFEST,
};

/**
 * Array of all manifests (for iteration/validation)
 */
export const ALL_MANIFESTS: RankManifest[] = Object.values(MANIFESTS);

/**
 * Check if a rank is allowed to access a specific route
 *
 * @param rank - User's effective rank
 * @param pathname - Route path to check
 * @returns true if allowed, false if denied
 */
export function isRouteAllowed(rank: UserRank, pathname: string): boolean {
  const manifest = MANIFESTS[rank];
  if (!manifest) return false;

  // Exact match in allowlist
  return manifest.allowed.includes(pathname as DomainRoute);
}

/**
 * Get the default home route for a rank
 *
 * @param rank - User's effective rank
 * @returns Home route path
 */
export function getRankHome(rank: UserRank): DomainRoute {
  return MANIFESTS[rank]?.home ?? MANIFESTS.crew.home;
}

/**
 * Get navigation items for a rank
 *
 * @param rank - User's effective rank  
 * @returns Navigation structure
 */
export function getRankNav(rank: UserRank) {
  return MANIFESTS[rank]?.nav ?? [];
}

/**
 * Get complete manifest for a rank
 *
 * @param rank - User's effective rank
 * @returns Complete rank manifest
 */
export function getManifest(rank: UserRank): RankManifest {
  return MANIFESTS[rank];
}
