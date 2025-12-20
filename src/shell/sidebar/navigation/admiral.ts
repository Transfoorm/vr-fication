/**──────────────────────────────────────────────────────────────────────┐
│  ⭐ ADMIRAL NAVIGATION                                                │
│  /src/shell/Sidebar/navigation/admiral.ts                            │
│                                                                        │
│  Navigation structure for Admiral rank (platform administrator)      │
└────────────────────────────────────────────────────────────────────────┘ */

import type { NavSection } from './types';

export const admiralNav: NavSection[] = [
  {
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/'
  },
  {
    label: 'Admin',
    icon: 'user-star',
    children: [
      { path: '/admin/users', label: 'Users' },
      { path: '/admin/plans', label: 'Plans' },
      { path: '/admin/showcase', label: 'Showcase' }
    ]
  },
  {
    label: 'System',
    icon: 'activity',
    children: [
      { path: '/system/ai', label: 'AI' },
      { path: '/system/ranks', label: 'Ranks' },
      { path: '/system/database', label: 'Database' }
    ]
  },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      { path: '/settings/preferences', label: 'Preferences' },
      { path: '/settings/account', label: 'Account' },
      { path: '/settings/security', label: 'Security' },
      { path: '/settings/billing', label: 'Billing' },
      { path: '/settings/plan', label: 'Plan' }
    ]
  }
];
