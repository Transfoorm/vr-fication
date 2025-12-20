/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DASHBOARD DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Dashboard owns ZERO data. Only UI state:
 *   - Layout preferences (classic/focus/metrics)
 *   - Visible widgets
 *   - Expanded sections
 *
 * SRS Doctrine: Dashboard is a shell, not a data domain
 * Route: /app/domains/dashboard (if applicable)
 *
 * ADP/PRISM Compliant: Full coordination fields for consistency
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Default widgets by rank - determines initial dashboard setup
 */
export const DEFAULT_WIDGETS_BY_RANK: Record<string, string[]> = {
  admiral: ['admin-stats', 'system-health', 'work-inbox', 'client-activity'],
  commodore: ['portfolio-summary', 'work-inbox', 'client-activity', 'finance-overview', 'branding-status'],
  captain: ['work-inbox', 'client-activity', 'finance-overview', 'project-status'],
  crew: ['work-inbox', 'client-sessions'],
};

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardData {
  layout: 'classic' | 'focus' | 'metrics';
  visibleWidgets: string[];
  expandedSections: string[];
}

export interface DashboardSlice {
  // UI preferences (zero data ownership)
  layout: 'classic' | 'focus' | 'metrics';
  visibleWidgets: string[];
  expandedSections: string[];
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface DashboardActions {
  hydrateDashboard: (data: Partial<DashboardData>, source?: ADPSource) => void;
  clearDashboard: () => void;
  setLayout: (layout: DashboardSlice['layout']) => void;
  toggleWidget: (widgetId: string) => void;
  toggleSection: (sectionId: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialDashboardState: DashboardSlice = {
  layout: 'classic',
  visibleWidgets: [],
  expandedSections: [],
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createDashboardSlice: StateCreator<
  DashboardSlice & DashboardActions,
  [],
  [],
  DashboardSlice & DashboardActions
> = (set) => ({
  ...initialDashboardState,

  hydrateDashboard: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateDashboard');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`🎯 FUSE: Dashboard domain hydrated via ${source}`, {
        layout: data.layout || 'classic',
        visibleWidgets: data.visibleWidgets?.length || 0,
        expandedSections: data.expandedSections?.length || 0,
      });
    }
    fuseTimer.end('hydrateDashboard', start);
  },

  clearDashboard: () => {
    const start = fuseTimer.start('clearDashboard');
    set(initialDashboardState);
    fuseTimer.end('clearDashboard', start);
  },

  setLayout: (layout) =>
    set({ layout }),

  toggleWidget: (widgetId) =>
    set((state) => ({
      visibleWidgets: state.visibleWidgets.includes(widgetId)
        ? state.visibleWidgets.filter((id) => id !== widgetId)
        : [...state.visibleWidgets, widgetId],
    })),

  toggleSection: (sectionId) =>
    set((state) => ({
      expandedSections: state.expandedSections.includes(sectionId)
        ? state.expandedSections.filter((id) => id !== sectionId)
        : [...state.expandedSections, sectionId],
    })),
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type DashboardStore = DashboardSlice & DashboardActions;
