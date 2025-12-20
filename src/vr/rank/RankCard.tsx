/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Rank Card                                         │
│  /src/prebuilts/rank/Card.tsx                                         │
│                                                                        │
│  TRUE VR: Self-contained rank statistics card.                        │
│  Reads from FUSE store (WARP preloaded), displays count.              │
│                                                                        │
│  Usage:                                                               │
│  <RankCard rank="captain" />                                          │
│  That's it. No props for data, no state management.                   │
│                                                                        │
│  FUSE/ADP Compliant: Reads from admin slice, no direct Convex.        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { RANK_METADATA } from '@/fuse/constants/ranks';
import { useMemo } from 'react';
import { T } from '@/vr';

export interface RankCardProps {
  rank: 'admiral' | 'commodore' | 'captain' | 'crew';
}

/**
 * RankCard - Intelligent rank statistics display
 *
 * FUSE/ADP Features:
 * - Reads from FUSE admin slice (WARP preloaded)
 * - Computes rank distribution from users array
 * - Displays rank-specific styling
 * - Shows count and percentage
 * - Zero loading states (data is preloaded)
 * - TTT Gap Model compliant
 */
export default function RankCard({ rank }: RankCardProps) {
  // Read from FUSE store - data preloaded by WARP
  const { users, status } = useFuse((state) => state.admin);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = status === 'hydrated';

  // Compute rank distribution from users array (memoized)
  const rankDist = useMemo(() => {
    if (!users || users.length === 0) {
      return { admiral: 0, commodore: 0, captain: 0, crew: 0, total: 0 };
    }

    const dist = { admiral: 0, commodore: 0, captain: 0, crew: 0, total: users.length };
    for (const user of users) {
      const userRank = (user as { rank?: string }).rank || 'crew';
      if (userRank in dist) {
        dist[userRank as keyof typeof dist]++;
      }
    }
    return dist;
  }, [users]);

  // Show nothing until hydrated (FUSE doctrine: no loading spinners)
  // TTTS-1 compliant: isHydrated already checks status === 'hydrated'
  if (!isHydrated) {
    return null;
  }

  const meta = RANK_METADATA[rank];
  const count = rankDist[rank] || 0;
  const percentage = rankDist.total > 0
    ? ((count / rankDist.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div
      className="vr-rank-card"
      data-rank={rank}
    >
      <div className="vr-rank-card-header">
        { }
        <img src={meta.icon} alt={meta.label} className="vr-rank-card-icon" />
        <T.title size="sm" weight="semibold" className="vr-rank-card-label">
          {meta.label}
        </T.title>
      </div>

      <T.title size="xl" weight="bold" className="vr-rank-card-count">
        {count}
      </T.title>

      <div className="vr-rank-card-footer">
        <T.title size="md" weight="semibold" className="vr-rank-card-percentage">
          {percentage}%
        </T.title>
        <T.body size="sm" className="vr-rank-card-description">
          of all users
        </T.body>
      </div>
    </div>
  );
}
