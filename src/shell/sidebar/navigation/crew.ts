/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ CREW NAVIGATION                                                   │
│  /src/shell/Sidebar/navigation/crew.ts                               │
│                                                                        │
│  Navigation structure for Crew rank (basic client/member access)       │
└────────────────────────────────────────────────────────────────────────┘ */

import type { NavSection } from './types';

export const crewNav: NavSection[] = [
  {
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: '/'
  },
/*  {
    label: 'Productivity',
    icon: 'calendar-check-2',
    children: [
      { path: '/productivity/calendar', label: 'Calendar' },
      { path: '/productivity/meetings', label: 'Meetings' }
    ]
  }, */
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
