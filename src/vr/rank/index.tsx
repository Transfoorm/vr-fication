/**──────────────────────────────────────────────────────────────────────┐
│  🤖 Rank Components Registry                                           │
│  /src/components/prebuilts/rank/index.tsx                              │
│                                                                        │
│  Central registry for all Rank VR components.                         │
│  TRUE VR Architecture - Intelligent, self-contained components.        │
└────────────────────────────────────────────────────────────────────────┘ */


import RankCard from './RankCard';
import UserRankTable from './UserRankTable';

/**
 * Rank Registry - Intelligent rank management components
 *
 * These are TRUE VRs:
 * ✅ Fetch their own data
 * ✅ Handle their own state
 * ✅ Manage their own actions
 * ✅ Zero configuration needed
 * ✅ Just drop them in and they work
 */
export const Rank = {
  Card: RankCard,
  Table: UserRankTable,
} as const;

// Direct exports
export {
  RankCard,
  UserRankTable,
};

// Type exports
export type { RankCardProps } from './RankCard';
