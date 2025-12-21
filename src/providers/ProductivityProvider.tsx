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
import { MOCK_EMAIL_DATA } from '@/features/productivity/email-console/mockData';

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
      // 🔥 FUSE 6.0 + WARP: Hydrate productivity domain with server data
      console.log('⚡ ProductivityProvider: Hydrating productivity domain (WARP)');
      hydrateProductivity(initialData);
    } else if (process.env.NODE_ENV === 'development') {
      // 🚧 DEV ONLY: Load mock email data for UI testing
      console.log('⚡ ProductivityProvider: Loading MOCK email data (dev mode)');
      hydrateProductivity({ email: MOCK_EMAIL_DATA });
    }
  }, [hydrateProductivity, initialData]); // Only run on mount - initialData comes from server preload

  // Zero UI - just wrap children
  // All domain data now available via useFuse() hooks
  return <>{children}</>;
}
