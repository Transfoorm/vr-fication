/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Page Component Registry                            │
│  /src/components/prebuilts/page/index.ts                               │
│                                                                        │
│  Central dispatcher for all page variants.                             │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│                                                                        │
│  // Named imports                                                     │
│  <Page.dashboard>...</Page.dashboard>                                 │
│  <Page.standard>...</Page.standard>                                   │
│                                                                        │
│  // Dynamic selection                                                 │
│  const Layout = Page[variant];                                        │
│  <Layout>...</Layout>                                                 │
└────────────────────────────────────────────────────────────────────────┘ */


import StandardPage from './Standard';
import FullPage from './Full';
import SplitPage from './Split';
import TriplePage from './Triple';
import SidebarPage from './Sidebar';
import DashboardPage, { DashboardWidget } from './Dashboard';
import BridgePage from './Bridge';

/**
 * Page Registry - All page variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant can evolve independently
 * ✅ No god component with giant switch statements
 * ✅ Tree-shakeable - unused variants aren't bundled
 * ✅ Testable in isolation
 * ✅ Clear folder structure = self-documenting
 * ✅ AI/CLI friendly: "Give me a dashboard page" → Page.dashboard
 */
export const Page = {
  standard: StandardPage,
  full: FullPage,
  split: SplitPage,
  triple: TriplePage,
  sidebar: SidebarPage,
  dashboard: DashboardPage,
  bridge: BridgePage,
} as const;

// Export individual components for direct import if needed
export {
  StandardPage,
  FullPage,
  SplitPage,
  TriplePage,
  SidebarPage,
  DashboardPage,
  DashboardWidget,
  BridgePage
};

// Type exports for TypeScript users
export type { StandardPageProps } from './Standard';
export type { FullPageProps } from './Full';
export type { SplitPageProps } from './Split';
export type { TriplePageProps } from './Triple';
export type { SidebarPageProps } from './Sidebar';
export type { DashboardPageProps } from './Dashboard';
export type { BridgePageProps, BridgeSection, BridgeFeedItem } from './Bridge';

// Helper type for variant names
export type PageVariant = keyof typeof Page;