/**──────────────────────────────────────────────────────────────────────┐
│  ⭐ ADMIRAL MANIFEST - Platform Administrator Permissions             │
│  /src/rank/admiral/manifest.ts                                        │
│                                                                        │
│  Admiral: Platform administrators with system-level access            │
│  • All platform features                                              │
│  • System administration                                              │
│  • User management (all ranks)                                        │
│  • Platform analytics                                                 │
│  • Full impersonation authority                                       │
│                                                                        │
│  SRS Layer 2: Static allowlist + navigation                          │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Admiral              │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES, flattenRoutes } from '@/rank/routes';
import type { RankManifest } from '@/rank/types';

export const ADMIRAL_MANIFEST: RankManifest = {
  id: 'admiral',
  label: 'Admiral',
  home: ROUTES.dashboard,
  allowed: [
    ROUTES.dashboard,
    ROUTES.home,
    ...flattenRoutes(ROUTES.admin),
    ...flattenRoutes(ROUTES.system),
    ...flattenRoutes(ROUTES.settings),
  ],
  nav: [
    { path: ROUTES.dashboard, label: 'Dashboard', icon: 'home' },
    { path: ROUTES.admin.users, label: 'Users', icon: 'users' },
    { path: ROUTES.admin.plans, label: 'Plans', icon: 'layers' },
    { path: ROUTES.admin.showcase, label: 'Showcase', icon: 'flag' },
    { path: ROUTES.system.ai, label: 'AI System', icon: 'cpu' },
    { path: ROUTES.system.ranks, label: 'Ranks', icon: 'shield' },
    { path: ROUTES.settings.account, label: 'Account', icon: 'user' },
    { path: ROUTES.settings.preferences, label: 'Preferences', icon: 'settings' },
  ],
} as const;
