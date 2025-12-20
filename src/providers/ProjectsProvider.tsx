/**──────────────────────────────────────────────────────────────────────┐
│  📋 PROJECTS PROVIDER - Domain Provider Pattern                       │
│  /src/providers/ProjectsProvider.tsx                                   │
│                                                                        │
│  Part of the Great Provider Ecosystem                                  │
│  Hydrates projects domain slice with WARP-preloaded data               │
│  Following proven _T2 pattern                                          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import type { ProjectsSlice } from '@/store/types';

interface ProjectsProviderProps {
  children: ReactNode;
  initialData?: Partial<ProjectsSlice>;
}

/**
 * ProjectsProvider - Hydrates projects domain with WARP-preloaded data
 *
 * Architecture:
 * - Receives initialData from section layout's WARP preload function
 * - Hydrates FUSE store projects slice on mount
 * - Zero UI - pure state hydration
 * - Children render with instant data access
 */
export function ProjectsProvider({ children, initialData }: ProjectsProviderProps) {
  const hydrateProjects = useFuse((state) => state.hydrateProjects);

  useEffect(() => {
    if (initialData) {
      // 🔥 FUSE 6.0 + WARP: Hydrate projects domain
      console.log('📋 ProjectsProvider: Hydrating projects domain');
      hydrateProjects(initialData);
    }

  }, [hydrateProjects, initialData]); // Only run on mount - initialData comes from server preload

  // Zero UI - just wrap children
  // All domain data now available via useFuse() hooks
  return <>{children}</>;
}
