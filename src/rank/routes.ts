/**──────────────────────────────────────────────────────────────────────┐
│  🗺️ SRS ROUTES CONSTANT - DRY Single Source of Truth                │
│  /src/rank/routes.ts                                                   │
│                                                                        │
│  Canonical route paths defined ONCE, referenced everywhere.            │
│  Manifests, navigation, links - all derive from this constant.         │
│                                                                        │
│  SRS Commandment #8: DRY Routes Constant                              │
│  • Define routes once                                                  │
│  • Manifests reference ROUTES, not string literals                     │
│  • Navigation derives from same source                                 │
│  • TypeScript ensures consistency                                      │
│                                                                        │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Routes                │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * Canonical domain routes (DRY - defined once, used everywhere)
 *
 * Scanned from src/app/(domains) structure on 2025-11-09
 */
export const ROUTES = {
  // Top-level routes
  dashboard: '/' as const,  // Dashboard at root (via (dashboard) route group)
  home: '/' as const,        // Alias for dashboard

  // Admin domain (Admiral only)
  admin: {
    showcase: '/admin/showcase' as const,
    plans: '/admin/plans' as const,
    users: '/admin/users' as const,
  },

  // Clients domain (All ranks with data scoping)
  clients: {
    overview: '/clients' as const,
    contacts: '/clients/contacts' as const,
    pipeline: '/clients/pipeline' as const,
    reports: '/clients/reports' as const,
    sessions: '/clients/sessions' as const,
    teams: '/clients/teams' as const,
  },

  // Finance domain (Captain, Commodore)
  finance: {
    overview: '/finance/overview' as const,
    root: '/finance' as const,
    invoices: '/finance/invoices' as const,
    payments: '/finance/payments' as const,
  },

  // Projects domain (Captain, Commodore)
  projects: {
    overview: '/projects' as const,
    charts: '/projects/charts' as const,
    locations: '/projects/locations' as const,
    tracking: '/projects/tracking' as const,
  },

  // Settings domain (All ranks)
  settings: {
    overview: '/settings' as const,
    account: '/settings/account' as const,
    billing: '/settings/billing' as const,
    preferences: '/settings/preferences' as const,
    plan: '/settings/plan' as const,
    security: '/settings/security' as const,
  },

  // System domain (Admiral only)
  system: {
    overview: '/system' as const,
    ai: '/system/ai' as const,
    ranks: '/system/ranks' as const,
  },

  // Productivity domain (Captain, Commodore)
  productivity: {
    overview: '/productivity' as const,
    bookings: '/productivity/bookings' as const,
    calendar: '/productivity/calendar' as const,
    email: '/productivity/email' as const,
    meetings: '/productivity/meetings' as const,
  },
} as const;

/**
 * Helper: Flatten a route group into array (preserves DomainRoute type)
 */
export function flattenRoutes<T extends Record<string, string>>(
  group: T
): readonly (`/${string}`)[] {
  return Object.values(group) as readonly (`/${string}`)[];
}
