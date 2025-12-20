/**──────────────────────────────────────────────────────────────────────┐
│  🏛️ SRS TYPE SYSTEM                                                  │
│  /src/rank/types.ts                                                   │
│                                                                        │
│  Core type definitions for Static Manifest Access Control.            │
│  These types are the foundation of the SRS architecture.             │
│                                                                        │
│  SRS Layer 2: Compile-Time Truth                                     │
│  • UserRank: The four hierarchical levels                             │
│  • DomainRoute: Type-safe route paths                                 │
│  • NavItem: Navigation menu structure                                 │
│  • RankManifest: Complete manifest interface                          │
│  • EffectiveUser: Session + impersonation state                       │
│                                                                        │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Types                │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * User Rank Hierarchy (Admiral > Commodore > Captain > Crew)
 */
export type UserRank = 'admiral' | 'commodore' | 'captain' | 'crew';

/**
 * Rank hierarchy levels (for comparison operations)
 */
export const RANK_HIERARCHY = {
  crew: 0,
  captain: 1,
  commodore: 2,
  admiral: 3,
} as const;

/**
 * Type-safe route path (manifest format, always starts with /)
 * Used in rank manifests: '/admin/users', '/settings/account'
 */
export type DomainRoute = `/${string}`;

/**
 * Internal route format (without leading /)
 * Used in sovereign router: 'admin/users', 'dashboard'
 */
export type InternalRoute = string;

/**
 * Navigation menu item
 */
export interface NavItem {
  path: DomainRoute;
  label: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
}

/**
 * Rank Manifest Definition
 *
 * Defines what routes a rank can access and how navigation is built.
 */
export interface RankManifest {
  id: UserRank;
  label: string;
  home: DomainRoute;
  allowed: readonly DomainRoute[];
  nav: readonly NavItem[];
}

/**
 * Complete manifest map (all four ranks)
 */
export type ManifestMap = Record<UserRank, RankManifest>;

/**
 * Effective User (Session + Impersonation State)
 *
 * Represents the current user's identity, considering impersonation.
 * Used throughout Convex queries for data scoping.
 */
export interface EffectiveUser {
  userId: string;
  orgId: string;
  effectiveRank: UserRank;
  actualRank: UserRank;
  isImpersonating: boolean;
  features?: string[]; // Extension point for within-rank capabilities
}

/**
 * Session Data (stored in cookie)
 */
export interface SessionData {
  userId: string;
  orgId: string;
  actualRank: UserRank;
  impersonation?: {
    targetRank: UserRank;
    targetUserId: string;
    targetOrgId: string;
    startedAt: number;
  };
}
