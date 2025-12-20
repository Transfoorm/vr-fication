/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ USE USER RANK HOOK                                                │
│  /src/hooks/useUserRank.ts                                             │
│                                                                        │
│  Returns current user's rank from FUSE store                          │
│  Used by parallel route layouts to determine which slot to render     │
│                                                                        │
│  Ranks: crew | captain | commodore | admiral                          │
│  Default: 'crew' (safest fallback)                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import type { UserRank } from '@/rank/types';

/**
 * Hook to get current user's rank from FUSE store
 *
 * @returns UserRank - crew | captain | commodore | admiral
 * @default 'crew' - Safest fallback if rank undefined
 */
export function useUserRank(): UserRank {
  const { rank } = useFuse();

  // Default to 'crew' if rank Setup Incomplete (safest permission level)
  return rank || 'crew';
}
