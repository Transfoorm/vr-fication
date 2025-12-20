/**──────────────────────────────────────────────────────────────────────┐
│  💰 FINANCES PROVIDER - Domain Provider Pattern                       │
│  /src/providers/FinanceProvider.tsx                                   │
│                                                                        │
│  Part of the Great Provider Ecosystem                                  │
│  Hydrates finances domain slice with WARP-preloaded data               │
│  Following proven _T2 pattern                                          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import type { FinanceSlice } from '@/store/types';

interface FinanceProviderProps {
  children: ReactNode;
  initialData?: Partial<FinanceSlice>;
}

/**
 * FinanceProvider - Hydrates finances domain with WARP-preloaded data
 *
 * Architecture:
 * - Receives initialData from section layout's WARP preload function
 * - Hydrates FUSE store finances slice on mount
 * - Zero UI - pure state hydration
 * - Children render with instant data access
 */
export function FinanceProvider({ children, initialData }: FinanceProviderProps) {
  const hydrateFinance = useFuse((state) => state.hydrateFinance);

  useEffect(() => {
    if (initialData) {
      // 🔥 FUSE 6.0 + WARP: Hydrate finances domain
      console.log('💰 FinanceProvider: Hydrating finances domain');
      hydrateFinance(initialData);
    }

  }, [hydrateFinance, initialData]); // Only run on mount - initialData comes from server preload

  // Zero UI - just wrap children
  // All domain data now available via useFuse() hooks
  return <>{children}</>;
}
