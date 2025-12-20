/**──────────────────────────────────────────────────────────────────────┐
│  🚢 CREW MANIFEST - Team Member Permissions                           │
│  /src/rank/crew/manifest.ts                                           │
│                                                                        │
│  Crew: Team members with limited, focused access                      │
│  • Client session notes (read-only)                                   │
│  • Task assignments                                                   │
│  • Basic settings                                                     │
│  • No financial data                                                  │
│  • No administrative functions                                        │
│                                                                        │
│  SRS Layer 2: Static allowlist + navigation                          │
│  References: TTT~BLUEPRINT-#3-UNIFIED-MASTER.md §Crew                 │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES, flattenRoutes } from '@/rank/routes';
import type { RankManifest } from '@/rank/types';

export const CREW_MANIFEST: RankManifest = {
  id: 'crew',
  label: 'Crew',
  home: ROUTES.dashboard,
  allowed: [
    ROUTES.dashboard,
    ROUTES.home,
    ...flattenRoutes(ROUTES.settings),
  ],
  nav: [
    { path: ROUTES.dashboard, label: 'Dashboard', icon: 'home' },
    { path: ROUTES.settings.account, label: 'Account', icon: 'user' },
    { path: ROUTES.settings.preferences, label: 'Preferences', icon: 'settings' },
  ],
} as const;
