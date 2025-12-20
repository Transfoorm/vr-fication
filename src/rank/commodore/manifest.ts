/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ COMMODORE MANIFEST - Portfolio Manager Permissions               │
│  /src/rank/commodore/manifest.ts                                      │
│                                                                        │
│  Commodore: Multi-business managers (upgraded Captains)               │
│  • Multiple business portfolios                                       │
│  • Cross-business analytics                                           │
│  • White-label branding                                               │
│  • All Captain features + portfolio/branding                          │
│                                                                        │
│  SRS Layer 2: Static allowlist + navigation                          │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Commodore            │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES, flattenRoutes } from '@/rank/routes';
import type { RankManifest } from '@/rank/types';

export const COMMODORE_MANIFEST: RankManifest = {
  id: 'commodore',
  label: 'Commodore',
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
