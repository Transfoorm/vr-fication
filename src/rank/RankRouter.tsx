/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ RANK ROUTER - Universal Parallel Route Slot Router               │
│  /src/components/layout/RankRouter.tsx                                │
│                                                                        │
│  TTT-compliant shared component for rank-based parallel routing       │
│  Single source of truth for all rank slot routing logic               │
│                                                                        │
│  Usage:                                                                │
│  <RankRouter captain={...} crew={...} commodore={...} admiral={...} />│
│                                                                        │
│  Supports partial slots (e.g., only captain + commodore)              │
│  Automatically handles fallbacks and access control                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useUserRank } from '@/hooks/useUserRank';
import { ReactNode } from 'react';
import { T } from '@/vr';

type RankRouterProps = {
  captain?: ReactNode;
  crew?: ReactNode;
  commodore?: ReactNode;
  admiral?: ReactNode;
  fallback?: ReactNode;
};

export default function RankRouter({
  captain,
  crew,
  commodore,
  admiral,
  fallback = <T.body>Access denied</T.body>,
}: RankRouterProps) {
  const rank = useUserRank();

  // Route to appropriate rank slot
  switch (rank) {
    case 'captain':
      return captain || fallback;
    case 'crew':
      return crew || fallback;
    case 'commodore':
      return commodore || fallback;
    case 'admiral':
      return admiral || fallback;
    default:
      // Safest fallback - crew is most restrictive
      return crew || fallback;
  }
}
