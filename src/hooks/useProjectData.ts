/**──────────────────────────────────────────────────────────────────────┐
│  📋 GOLDEN BRIDGE HOOK - Projects Domain                              │
│  /src/hooks/useProjectData.ts                                          │
│                                                                        │
│  Clean API for accessing projects domain data                          │
│  Abstracts FUSE store complexity from components                       │
│  Following proven _T2 Golden Bridge pattern                            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * Golden Bridge Hook - Projects Domain
 *
 * Provides clean, domain-specific API for components
 * Hides FUSE store structure and complexity
 * Following WRAP pattern: { data, computed, actions, flags }
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useProjectData();
 * const { charts, locations, tracking } = data;
 * const { totalCharts } = computed;
 * const { isHydrated } = flags;
 * ```
 */
export function useProjectData() {
  const projects = useFuse((state) => state.projects);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = projects.status === 'hydrated';

  return {
    // DATA: Raw domain data
    data: {
      charts: projects.charts,
      locations: projects.locations,
      tracking: projects.tracking,
    },

    // COMPUTED: Calculated values from data
    computed: {
      totalCharts: projects.charts.length,
      totalLocations: projects.locations.length,
      totalTracking: projects.tracking.length,
      hasAnyData: projects.charts.length > 0 || projects.locations.length > 0 || projects.tracking.length > 0,
    },

    // ACTIONS: Mutations and operations (add as needed)
    actions: {
      // Future: Add mutations here
      // updateChart: (id, updates) => store.updateChart(id, updates),
    },

    // FLAGS: Hydration and state flags
    flags: {
      isHydrated,
      isLoading: false, // Always false with WARP preloading
    },
  };
}
