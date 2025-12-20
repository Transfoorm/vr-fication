/**──────────────────────────────────────────────────────────────────────┐
│  🤖 Tabs Component Registry                                            │
│  /src/components/prebuilts/tabs/index.tsx                              │
│                                                                        │
│  Central dispatcher for all tabs variants.                             │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Tabs } from '@/prebuilts/tabs';                  │
│                                                                        │
│  <Tabs.simple tabs={items} activeTab="id" onTabChange={fn} />        │
│  <Tabs.panels tabs={items} activeTab="id" onTabChange={fn} />        │
└────────────────────────────────────────────────────────────────────────┘ */

import SimpleTabs from './Simple';
import PanelTabs from './PanelTabs';
import TabsWithContent from './TabsWithContent';

/**
 * Tabs Registry - All tabs variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused tabs aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 */
export const Tabs = {
  simple: SimpleTabs,
  panels: PanelTabs,
  withContent: TabsWithContent,
} as const;

// Export individual components for direct import if needed
export {
  SimpleTabs,
  PanelTabs,
  TabsWithContent,
};

// Type exports for TypeScript users
export type { SimpleTabsProps, TabItem } from './Simple';
export type { PanelTabsProps, PanelTabItem } from './PanelTabs';
export type { TabsWithContentProps, TabWithContent } from './TabsWithContent';

// Helper type for variant names
export type TabsVariant = keyof typeof Tabs;
