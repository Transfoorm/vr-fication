/**──────────────────────────────────────────────────────────────────────┐
│  🔱 ROUTER - The Sovereign Switch                                     │
│  /src/app/domains/Router.tsx                                          │
│                                                                        │
│  FUSE 6.0: This component switches views based on sovereign.route.    │
│  No server fetch. No RSC. Pure client-side routing.                   │
│                                                                        │
│  When sovereign.route changes:                                        │
│  • This component re-renders (sub-millisecond)                        │
│  • The correct domain component is returned                           │
│  • Domain reads from FUSE store (data already there via WARP)         │
│  • Zero loading states. Instant perception.                           │
│                                                                        │
│  This is the spine of the Sovereign Router.                           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useFuse } from '@/store/fuse';

// ═══════════════════════════════════════════════════════════════════════
// SOVEREIGN VIEWS
// ═══════════════════════════════════════════════════════════════════════

// Dashboard
import Dashboard from './Dashboard';

// Admin
import Users from './admin/Users';
import Plans from './admin/Plans';
import Showcase from './admin/Showcase';

// Clients
import Contacts from './clients/Contacts';
import Teams from './clients/Teams';
import Sessions from './clients/Sessions';
import Pipeline from './clients/Pipeline';
import ClientsReports from './clients/Reports';

// Finance
import Overview from './finance/Overview';
import Transactions from './finance/Transactions';
import Invoices from './finance/Invoices';
import Payments from './finance/Payments';
import FinanceReports from './finance/Reports';

// Productivity
import Calendar from './productivity/Calendar';
import Bookings from './productivity/Bookings';
import Tasks from './productivity/Tasks';
import Email from './productivity/Email';
import Meetings from './productivity/Meetings';

// Projects
import Charts from './projects/Charts';
import Locations from './projects/Locations';
import Tracking from './projects/Tracking';

// Settings
import Account from './settings/Account';
import Preferences from './settings/Preferences';
import Security from './settings/Security';
import Billing from './settings/Billing';
import Plan from './settings/Plan';

// System
import AI from './system/AI';
import Ranks from './system/Ranks';
import Database from './system/Database';

// ═══════════════════════════════════════════════════════════════════════
// ROUTER VIEW - THE SOVEREIGN SWITCH
// ═══════════════════════════════════════════════════════════════════════

// Get route from URL
function getRouteFromURL(): string {
  const path = window.location.pathname;
  return path === '/' ? 'dashboard' : path.replace(/^\//, '');
}

export default function Router() {
  const storeRoute = useFuse((s) => s.sovereign.route);
  const navigate = useFuse((s) => s.navigate);

  // 🔱 FOUC Prevention: Router is client-only (ssr: false in FuseApp)
  // On mount, sync store to URL. This handles direct navigation/refresh.
  useEffect(
    () => {
      const urlRoute = getRouteFromURL();
      if (storeRoute !== urlRoute) {
        navigate(urlRoute);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // Intentionally empty - only sync on mount
  );

  // Use URL directly on first render, then store takes over after sync
  // Since this component is client-only, window is always available
  const rawRoute = storeRoute === 'dashboard' && getRouteFromURL() !== 'dashboard'
    ? getRouteFromURL()
    : storeRoute;

  // Strip hash from route for matching (hash is for tab selection within page)
  const route = rawRoute.split('#')[0];

  // 🔱 Auth routes are handled by Next.js (auth) route group, not Sovereign Router
  if (route === 'sign-in' || route === 'sign-up' || route === 'sso-callback') {
    return null;
  }

  // Performance measurement
  const startRender = performance.now();

  // ─────────────────────────────────────────────────────────────────────
  // ROUTE SWITCH - Each case returns the appropriate view
  // ─────────────────────────────────────────────────────────────────────
  const renderView = () => {
    switch (route) {
      // ═══════════════════════════════════════════════════════════════
      // DASHBOARD
      // ═══════════════════════════════════════════════════════════════
      case 'dashboard':
        return <Dashboard />;

      // ═══════════════════════════════════════════════════════════════
      // PRODUCTIVITY
      // ═══════════════════════════════════════════════════════════════
      case 'productivity/calendar':
        return <Calendar />;
      case 'productivity/bookings':
        return <Bookings />;
      case 'productivity/tasks':
        return <Tasks />;
      case 'productivity/email':
        return <Email />;
      case 'productivity/meetings':
        return <Meetings />;

      // ═══════════════════════════════════════════════════════════════
      // ADMIN
      // ═══════════════════════════════════════════════════════════════
      case 'admin/users':
        return <Users />;
      case 'admin/plans':
        return <Plans />;
      case 'admin/showcase':
        return <Showcase />;

      // ═══════════════════════════════════════════════════════════════
      // CLIENTS
      // ═══════════════════════════════════════════════════════════════
      case 'clients/contacts':
        return <Contacts />;
      case 'clients/teams':
        return <Teams />;
      case 'clients/sessions':
        return <Sessions />;
      case 'clients/pipeline':
        return <Pipeline />;
      case 'clients/reports':
        return <ClientsReports />;

      // ═══════════════════════════════════════════════════════════════
      // FINANCE
      // ═══════════════════════════════════════════════════════════════
      case 'finance/overview':
        return <Overview />;
      case 'finance/transactions':
        return <Transactions />;
      case 'finance/invoices':
        return <Invoices />;
      case 'finance/payments':
        return <Payments />;
      case 'finance/reports':
        return <FinanceReports />;

      // ═══════════════════════════════════════════════════════════════
      // PROJECTS
      // ═══════════════════════════════════════════════════════════════
      case 'projects/charts':
        return <Charts />;
      case 'projects/locations':
        return <Locations />;
      case 'projects/tracking':
        return <Tracking />;

      // ═══════════════════════════════════════════════════════════════
      // SYSTEM
      // ═══════════════════════════════════════════════════════════════
      case 'system/ai':
        return <AI />;
      case 'system/ranks':
        return <Ranks />;
      case 'system/database':
        return <Database />;

      // ═══════════════════════════════════════════════════════════════
      // SETTINGS
      // ═══════════════════════════════════════════════════════════════
      case 'settings/account':
        return <Account />;
      case 'settings/preferences':
        return <Preferences />;
      case 'settings/security':
        return <Security />;
      case 'settings/billing':
        return <Billing />;
      case 'settings/plan':
        return <Plan />;

      // ═══════════════════════════════════════════════════════════════
      // FALLBACK
      // ═══════════════════════════════════════════════════════════════
      default:
        console.warn(`🔱 SR: Unknown route "${route}", showing dashboard`);
        return <Dashboard />;
    }
  };

  const view = renderView();

  // Log render time in development
  if (process.env.NODE_ENV === 'development') {
    const renderTime = performance.now() - startRender;
    if (renderTime > 1) {
      console.log(`🔱 Router: ${route} rendered in ${renderTime.toFixed(1)}ms`);
    }
  }

  // Key by route to force React to unmount/remount when route changes
  return <div key={route}>{view}</div>;
}
