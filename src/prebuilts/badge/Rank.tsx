/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Rank Badge                                        │
│  /src/prebuilts/badge/Rank.tsx                                        │
│                                                                        │
│  Colored badge for user ranks (admiral, commodore, captain, crew).   │
│                                                                        │
│  Usage:                                                                │
│  import { Badge } from '@/prebuilts';                      │
│  <Badge.rank rank="admiral" />                                        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

export type RankType = 'admiral' | 'commodore' | 'captain' | 'crew' | null | undefined;

export interface RankBadgeProps {
  rank: RankType;
  className?: string;
}

/**
 * RankBadge - Colored badge for user ranks
 *
 * Variants:
 * - admiral: Red background
 * - commodore: Orange background
 * - captain: Blue background
 * - crew: Yellow background (default)
 *
 * Perfect for:
 * - User tables
 * - Profile displays
 * - Access level indicators
 */
export default function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const rankClass = rank || 'crew';

  return (
    <span className={`vr-badge-rank vr-badge-rank-${rankClass} ${className}`}>
      {rank || 'crew'}
    </span>
  );
}
