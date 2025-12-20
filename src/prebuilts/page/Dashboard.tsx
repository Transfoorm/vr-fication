/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Dashboard Page                                     │
│  /src/components/prebuilts/page/dashboard/index.tsx                    │
│                                                                        │
│  Auto-responsive grid layout for dashboard widgets.                    │
│  Intelligent reflow. Zero-decision widget placement.                   │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.dashboard>                                                     │
│    <Widget1 />                                                        │
│    <Widget2 />                                                        │
│    <Widget3 />                                                        │
│  </Page.dashboard>                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

export interface DashboardPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * DashboardPage - Auto-responsive grid for widgets
 *
 * Features:
 * - CSS Grid auto-fit with minimum width constraint
 * - Widgets automatically reflow based on viewport
 * - Consistent gap between all widgets
 * - No manual row/column management needed
 *
 * Perfect for:
 * - Analytics dashboards
 * - Monitoring screens
 * - Data visualization grids
 * - Admin home pages
 *
 * Widget behavior:
 * - Minimum width: 300px (configurable via --page-dashboard-min-width)
 * - Automatically fills available columns
 * - Responsive breakpoints handled by CSS Grid
 */
export default function DashboardPage({
  children,
  className = ''
}: DashboardPageProps) {
  return (
    <div className={`vr-page vr-page-dashboard ${className}`}>
      {children}
    </div>
  );
}

/**
 * DashboardWidget - Optional wrapper for dashboard items
 * Provides consistent widget styling
 */
export function DashboardWidget({
  children,
  span = 1,
  className = ''
}: {
  children: ReactNode;
  span?: 1 | 2 | 3 | 'full';
  className?: string;
}) {
  const spanClass = span === 'full' ? 'widget-full' : `widget-span-${span}`;

  return (
    <div className={`vr-page-dashboard-widget ${spanClass} ${className}`}>
      {children}
    </div>
  );
}