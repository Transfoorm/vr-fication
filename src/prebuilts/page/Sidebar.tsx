/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Sidebar Page                                       │
│  /src/components/prebuilts/page/sidebar/index.tsx                      │
│                                                                        │
│  Fixed sidebar + flexible main content. Enterprise navigation pattern. │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.sidebar>                                                       │
│    <Navigation />                                                     │
│    <MainContent />                                                   │
│  </Page.sidebar>                                                      │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode, Children } from 'react';

export interface SidebarPageProps {
  children: ReactNode;
  className?: string;
  /**
   * Sidebar position
   * @default 'left'
   */
  side?: 'left' | 'right';
  /**
   * Collapse sidebar on mobile
   * @default true
   */
  collapsible?: boolean;
}

/**
 * SidebarPage - Fixed sidebar with main content area
 *
 * Features:
 * - Fixed width sidebar (250px default)
 * - Flexible main content area
 * - Optional left/right positioning
 * - Mobile responsive (collapses to full width)
 * - Consistent spacing between sections
 *
 * Perfect for:
 * - Settings pages
 * - Documentation layouts
 * - Admin panels
 * - File explorers
 * - Navigation-heavy interfaces
 *
 * IMPORTANT: Expects exactly 2 children (sidebar, main)
 */
export default function SidebarPage({
  children,
  className = '',
  side = 'left',
  collapsible = true
}: SidebarPageProps) {
  const childArray = Children.toArray(children);

  // Warn in development if not exactly 2 children
  if (process.env.NODE_ENV === 'development' && childArray.length !== 2) {
    console.warn(
      `SidebarPage expects exactly 2 children (sidebar, main), received ${childArray.length}. ` +
      'Only first 2 will be displayed.'
    );
  }

  const sideClass = side === 'right' ? 'sidebar-right' : '';
  const collapsibleClass = collapsible ? 'sidebar-collapsible' : '';

  return (
    <div className={`vr-page vr-page-sidebar ${sideClass} ${collapsibleClass} ${className}`}>
      <aside className="vr-page-sidebar-sidebar-section">{childArray[0]}</aside>
      <main className="vr-page-sidebar-sidebar-main">{childArray[1]}</main>
    </div>
  );
}

/**
 * Helper components for semantic markup
 */
export function SidebarSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <aside className={`sidebar-section ${className}`}>{children}</aside>;
}

export function SidebarMain({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`sidebar-main ${className}`}>{children}</main>;
}