/**──────────────────────────────────────────────────────────────────────┐
│  🤖 Card Component Registry                                            │
│  /src/components/prebuilts/card/index.tsx                              │
│                                                                        │
│  Central dispatcher for all card variants.                             │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Card } from '@/prebuilts/card';                  │
│                                                                        │
│  <Card.metric title="Sessions" value={127} />                         │
│  <Card.activity items={activities} />                                 │
│  <Card.action actions={buttons} />                                    │
│  <Card.standard>{content}</Card.standard>                             │
└────────────────────────────────────────────────────────────────────────┘ */


import StandardCard from './Standard';
import MetricCard from './Metric';
import ActivityCard from './Activity';
import ActionCard from './Action';
import ShowcaseCard from './Showcase';
import InputShowcase from './InputShowcase';

/**
 * Card Registry - All card variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused cards aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 */
export const Card = {
  standard: StandardCard,
  metric: MetricCard,
  activity: ActivityCard,
  action: ActionCard,
  showcase: ShowcaseCard,
  inputShowcase: InputShowcase,
} as const;

// Export individual components for direct import if needed
export {
  StandardCard,
  MetricCard,
  ActivityCard,
  ActionCard,
  ShowcaseCard,
  InputShowcase,
};

// Type exports for TypeScript users
export type { StandardCardProps } from './Standard';
export type { MetricCardProps } from './Metric';
export type { ActivityCardProps, ActivityItem } from './Activity';
export type { ActionCardProps, ActionItem } from './Action';
export type { ShowcaseCardProps } from './Showcase';

// Helper type for variant names
export type CardVariant = keyof typeof Card;