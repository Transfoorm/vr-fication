/**──────────────────────────────────────────────────────────────────────┐
│  ⭐ ADMIRAL NAVIGATION                                                │
│  /src/shell/Sidebar/navigation/admiral.ts                            │
│                                                                        │
│  Navigation structure for Admiral rank (platform administrator)      │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES } from '@/rank/routes';
import type { NavSection } from './types';

export const admiralNav: NavSection[] = [
  {
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: ROUTES.dashboard
  },
  {
    label: 'Admin',
    icon: 'user-star',
    children: [
      { path: ROUTES.admin.users, label: 'Users' },
      { path: ROUTES.admin.plans, label: 'Plans' },
      { path: ROUTES.admin.showcase, label: 'Showcase' }
    ]
  },
  {
    label: 'System',
    icon: 'activity',
    children: [
      { path: ROUTES.system.database, label: 'Database' },
      { path: ROUTES.system.ai, label: 'AI' },
      { path: ROUTES.system.ranks, label: 'Ranks' }
    ]
  },
  {
    label: 'Productivity',
    icon: 'square-check-big',
    children: [
      { path: ROUTES.productivity.email, label: 'Email' },
      { path: ROUTES.productivity.calendar, label: 'Calendar' },
      { path: ROUTES.productivity.meetings, label: 'Meetings' },
      { path: ROUTES.productivity.bookings, label: 'Bookings' }
    ]
  },
  {
    label: 'Settings',
    icon: 'settings',
    children: [
      { path: ROUTES.settings.preferences, label: 'Preferences' },
      { path: ROUTES.settings.account, label: 'Account' },
      { path: ROUTES.settings.security, label: 'Security' },
      { path: ROUTES.settings.billing, label: 'Billing' },
      { path: ROUTES.settings.plan, label: 'Plan' }
    ]
  }
];
