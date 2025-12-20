/**──────────────────────────────────────────────────────────────────────┐
│  ⚡ WORK PROVIDER - Domain Provider Pattern                            │
│  /src/providers/ProductivityProvider.tsx                                       │
│                                                                        │
│  Part of the Great Provider Ecosystem                                  │
│  Hydrates work domain slice with WARP-preloaded data                   │
│  Following proven _T2 pattern                                          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import type { ProductivitySlice } from '@/store/types';

interface ProductivityProviderProps {
  children: ReactNode;
  initialData?: Partial<ProductivitySlice>;
}

/**
 * ProductivityProvider - Hydrates work domain with WARP-preloaded data
 *
 * Architecture:
 * - Receives initialData from section layout's WARP preload function
 * - Hydrates FUSE store work slice on mount
 * - Zero UI - pure state hydration
 * - Children render with instant data access
 */
export function ProductivityProvider({ children, initialData }: ProductivityProviderProps) {
  const hydrateProductivity = useFuse((state) => state.hydrateProductivity);

  useEffect(() => {
    if (initialData) {
      // 🔥 FUSE 6.0 + WARP: Hydrate work domain
      console.log('⚡ ProductivityProvider: Hydrating work domain');
      hydrateProductivity(initialData);
    }

  }, [hydrateProductivity, initialData]); // Only run on mount - initialData comes from server preload

  // Zero UI - just wrap children
  // All domain data now available via useFuse() hooks
  return <>{children}</>;
}
