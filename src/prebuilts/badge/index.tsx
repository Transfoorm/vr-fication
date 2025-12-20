/**──────────────────────────────────────────────────────────────────────┐
│  🤖 BADGE VARIANT ROBOT - Registry                                    │
│  /src/components/prebuilts/badge/index.tsx                            │
│                                                                        │
│  Central registry for all Badge variants.                             │
│                                                                        │
│  Usage:                                                                │
│  import { Badge } from '@/prebuilts';                      │
│  <Badge.rank rank="admiral" />                                        │
│  <Badge.setup status="complete" />                                    │
└────────────────────────────────────────────────────────────────────────┘ */


import RankBadge from './Rank';
import SetupBadge from './Setup';
import StatusBadge from './BadgeStatus';
import CascadeBadge from './Cascade';

export const Badge = {
  rank: RankBadge,
  setup: SetupBadge,
  status: StatusBadge,
  cascade: CascadeBadge,
} as const;

// Named exports for direct imports
export { RankBadge, SetupBadge, StatusBadge, CascadeBadge };

// Type exports
export type { RankBadgeProps, RankType } from './Rank';
export type { SetupBadgeProps, SetupStatusType } from './Setup';
export type { BadgeStatusProps, StatusVariant } from './BadgeStatus';
export type { CascadeBadgeProps, CascadeStatusType } from './Cascade';

// Variant type for generic usage
export type BadgeVariant = keyof typeof Badge;
