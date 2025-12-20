/**──────────────────────────────────────────────────────────────────────┐
│  👥 CLIENTS PROVIDER - Domain Provider Pattern                        │
│  /src/providers/ClientsProvider.tsx                                    │
│                                                                        │
│  Part of the Great Provider Ecosystem                                  │
│  Hydrates clients domain slice with WARP-preloaded data                │
│  Following proven _T2 pattern                                          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import type { ClientsSlice } from '@/store/types';

interface ClientsProviderProps {
  children: ReactNode;
  initialData?: Partial<ClientsSlice>;
}

/**
 * ClientsProvider - Hydrates clients domain with WARP-preloaded data
 *
 * Architecture:
 * - Receives initialData from section layout's WARP preload function
 * - Hydrates FUSE store clients slice on mount
 * - Zero UI - pure state hydration
 * - Children render with instant data access
 */
export function ClientsProvider({ children, initialData }: ClientsProviderProps) {
  const hydrateClients = useFuse((state) => state.hydrateClients);

  useEffect(() => {
    if (initialData) {
      // 🔥 FUSE 6.0 + WARP: Hydrate clients domain
      console.log('👥 ClientsProvider: Hydrating clients domain');
      hydrateClients(initialData);
    }

  }, [hydrateClients, initialData]); // Only run on mount - initialData comes from server preload

  // Zero UI - just wrap children
  // All domain data now available via useFuse() hooks
  return <>{children}</>;
}
