/**──────────────────────────────────────────────────────────────────────┐
│  ⚓ CAPTAIN MANIFEST - Business Owner Permissions                     │
│  /src/rank/captain/manifest.ts                                        │
│                                                                        │
│  Captain: Business owners with full organizational control            │
│  • Complete client management                                         │
│  • Full financial access                                              │
│  • Team management (Crew)                                             │
│  • All business features                                              │
│                                                                        │
│  SRS Layer 2: Static allowlist + navigation                          │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Captain              │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES, flattenRoutes } from '@/rank/routes';
import type { RankManifest } from '@/rank/types';

export const CAPTAIN_MANIFEST: RankManifest = {
  id: 'captain',
  label: 'Captain',
  home: ROUTES.dashboard,
  allowed: [
    ROUTES.dashboard,
    ROUTES.home,
    ...flattenRoutes(ROUTES.productivity),
    ...flattenRoutes(ROUTES.clients),
    ...flattenRoutes(ROUTES.finance),
    ...flattenRoutes(ROUTES.projects),
    ...flattenRoutes(ROUTES.settings),
  ],
  nav: [
    { path: ROUTES.dashboard, label: 'Dashboard', icon: 'home' },
    { path: ROUTES.productivity.email, label: 'Productivity', icon: 'briefcase' },
    { path: ROUTES.clients.contacts, label: 'Clients', icon: 'users' },
    { path: ROUTES.finance.overview, label: 'Finance', icon: 'dollar-sign' },
    { path: ROUTES.projects.overview, label: 'Projects', icon: 'folder' },
    { path: ROUTES.settings.account, label: 'Settings', icon: 'settings' },
  ],
} as const;
