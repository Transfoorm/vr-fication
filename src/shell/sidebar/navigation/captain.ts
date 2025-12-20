/**──────────────────────────────────────────────────────────────────────┐
│  ⚓ CAPTAIN NAVIGATION                                                │
│  /src/shell/Sidebar/navigation/captain.ts                            │
│                                                                        │
│  Navigation structure for Captain rank (business owner)              │
│  DRY: Uses ROUTES constant for all paths                             │
└────────────────────────────────────────────────────────────────────────┘ */

import { ROUTES } from '@/rank/routes';
import type { NavSection } from './types';

export const captainNav: NavSection[] = [
  {
    label: 'Dashboard',
    icon: 'layout-dashboard',
    path: ROUTES.dashboard
  },
  {
    label: 'Productivity',
    icon: 'send',
    children: [
      { path: ROUTES.productivity.email, label: 'Email' },
      { path: ROUTES.productivity.calendar, label: 'Calendar' },
      { path: ROUTES.productivity.meetings, label: 'Meetings' },
      { path: ROUTES.productivity.bookings, label: 'Bookings' }
    ]
  },
  {
    label: 'Clients',
    icon: 'handshake',
    children: [
      { path: ROUTES.clients.contacts, label: 'Contacts' },
      { path: ROUTES.clients.pipeline, label: 'Pipeline' },
      { path: ROUTES.clients.sessions, label: 'Sessions' },
      { path: ROUTES.clients.teams, label: 'Teams' },
      { path: ROUTES.clients.reports, label: 'Reports' }
    ]
  },
  {
    label: 'Finance',
    icon: 'hand-coins',
    children: [
      { path: ROUTES.finance.overview, label: 'Overview' },
      { path: ROUTES.finance.invoices, label: 'Invoices' },
      { path: ROUTES.finance.payments, label: 'Payments' }
    ]
  },
  {
    label: 'Projects',
    icon: 'chart-bar-stacked',
    children: [
      { path: ROUTES.projects.tracking, label: 'Tracking' },
      { path: ROUTES.projects.charts, label: 'Charts' },
      { path: ROUTES.projects.locations, label: 'Locations' }
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
