/**──────────────────────────────────────────────────────────────────────┐
│  🎯 DASHBOARD PROVIDER - UI Preferences Sync                           │
│  /src/providers/DashboardProvider.tsx                                  │
│                                                                        │
│  Dashboard owns ZERO data. Only UI preferences.                        │
│  Syncs between localStorage and FUSE store.                            │
│  Provides action methods for dashboard interactions.                   │
│                                                                        │
│  Different from other providers:                                       │
│  • No WARP preloading (no server data)                                │
│  • No Convex queries (pure client-side)                               │
│  • localStorage persistence (not database)                             │
│  • Action methods included (setLayout, toggleWidget, etc.)            │
│                                                                        │
│  References: TTT~DASHBOARD-IMPLEMENTATION-DOCTRINE.md §Provider        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import { DEFAULT_WIDGETS_BY_RANK } from '@/store/domains/dashboard';
import type { DashboardSlice } from '@/store/types';

// localStorage keys
const STORAGE_KEYS = {
  LAYOUT: 'dashboard-layout',
  VISIBLE_WIDGETS: 'dashboard-visible-widgets',
  EXPANDED_SECTIONS: 'dashboard-expanded-sections',
} as const;

interface DashboardProviderProps {
  children: ReactNode;
}

/**
 * DashboardProvider - Manages dashboard UI preferences
 *
 * Architecture:
 * - Loads preferences from localStorage on mount
 * - Initializes with rank-based default widgets if none exist
 * - Provides action methods for dashboard interactions
 * - Syncs all changes to localStorage automatically
 * - Zero UI - pure state management
 *
 * Usage:
 * ```tsx
 * <DashboardProvider>
 *   <DashboardView />
 * </DashboardProvider>
 * ```
 */
export function DashboardProvider({ children }: DashboardProviderProps) {
  const rank = useFuse((state) => state.rank);
  const dashboard = useFuse((state) => state.dashboard);
  const hydrateDashboard = useFuse((state) => state.hydrateDashboard);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedLayout = localStorage.getItem(STORAGE_KEYS.LAYOUT) as DashboardSlice['layout'] | null;
    const savedWidgets = localStorage.getItem(STORAGE_KEYS.VISIBLE_WIDGETS);
    const savedSections = localStorage.getItem(STORAGE_KEYS.EXPANDED_SECTIONS);

    // Determine widgets: saved > rank-based defaults > fallback
    let visibleWidgets: string[] = [];
    if (savedWidgets) {
      try {
        visibleWidgets = JSON.parse(savedWidgets);
      } catch (e) {
        console.warn('Failed to parse saved widgets', e);
      }
    }

    // If no saved widgets and rank is known, use rank-based defaults
    if (visibleWidgets.length === 0 && rank) {
      visibleWidgets = DEFAULT_WIDGETS_BY_RANK[rank] || [];
    }

    // Parse expanded sections
    let expandedSections: string[] = [];
    if (savedSections) {
      try {
        expandedSections = JSON.parse(savedSections);
      } catch (e) {
        console.warn('Failed to parse saved sections', e);
      }
    }

    // Hydrate dashboard with loaded/default preferences
    // Note: status is set internally by hydrateDashboard (ADP coordination)
    hydrateDashboard({
      layout: savedLayout || 'classic',
      visibleWidgets,
      expandedSections,
    });

    console.log('🎯 DashboardProvider: Hydrated from localStorage', {
      layout: savedLayout || 'classic',
      widgets: visibleWidgets.length,
      sections: expandedSections.length,
    });
  }, [rank, hydrateDashboard]);

  // Sync layout changes to localStorage (TTTS-1 compliant: check 'hydrated')
  useEffect(() => {
    if (typeof window === 'undefined' || dashboard.status !== 'hydrated') return;

    localStorage.setItem(STORAGE_KEYS.LAYOUT, dashboard.layout);
  }, [dashboard.layout, dashboard.status]);

  // Sync visible widgets to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || dashboard.status !== 'hydrated') return;

    localStorage.setItem(
      STORAGE_KEYS.VISIBLE_WIDGETS,
      JSON.stringify(dashboard.visibleWidgets)
    );
  }, [dashboard.visibleWidgets, dashboard.status]);

  // Sync expanded sections to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || dashboard.status !== 'hydrated') return;

    localStorage.setItem(
      STORAGE_KEYS.EXPANDED_SECTIONS,
      JSON.stringify(dashboard.expandedSections)
    );
  }, [dashboard.expandedSections, dashboard.status]);

  // Zero UI - just wrap children
  // Dashboard UI preferences now available via useDashboardData()
  return <>{children}</>;
}

/**
 * Hook for dashboard actions (convenience wrapper)
 *
 * Provides methods for interacting with dashboard UI state.
 * Use this in components that need to modify dashboard preferences.
 *
 * Usage:
 * ```tsx
 * const actions = useDashboardActions();
 * actions.setLayout('focus');
 * actions.toggleWidget('work-inbox');
 * ```
 */
export function useDashboardActions() {
  const setLayout = (layout: DashboardSlice['layout']) => {
    useFuse.getState().hydrateDashboard({ layout });
  };

  const toggleWidget = (widgetId: string) => {
    const { dashboard } = useFuse.getState();
    const visibleWidgets = dashboard.visibleWidgets.includes(widgetId)
      ? dashboard.visibleWidgets.filter((id) => id !== widgetId)
      : [...dashboard.visibleWidgets, widgetId];

    useFuse.getState().hydrateDashboard({ visibleWidgets });
  };

  const toggleSection = (sectionId: string) => {
    const { dashboard } = useFuse.getState();
    const expandedSections = dashboard.expandedSections.includes(sectionId)
      ? dashboard.expandedSections.filter((id) => id !== sectionId)
      : [...dashboard.expandedSections, sectionId];

    useFuse.getState().hydrateDashboard({ expandedSections });
  };

  const resetToDefaults = () => {
    const { rank } = useFuse.getState();
    const defaultWidgets = rank ? DEFAULT_WIDGETS_BY_RANK[rank] : [];

    // Note: status is set internally by hydrateDashboard (ADP coordination)
    useFuse.getState().hydrateDashboard({
      layout: 'classic',
      visibleWidgets: defaultWidgets,
      expandedSections: [],
    });

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.LAYOUT);
      localStorage.removeItem(STORAGE_KEYS.VISIBLE_WIDGETS);
      localStorage.removeItem(STORAGE_KEYS.EXPANDED_SECTIONS);
    }
  };

  return {
    setLayout,
    toggleWidget,
    toggleSection,
    resetToDefaults,
  };
}
