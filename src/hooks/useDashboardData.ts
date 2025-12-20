/**──────────────────────────────────────────────────────────────────────┐
│  🎯 COMPOSITION HOOK - Dashboard Meta-Shell                           │
│  /src/hooks/useDashboardData.ts                                        │
│                                                                        │
│  Dashboard owns ZERO data. Pure composition layer.                    │
│  Reads from WARP-primed domain slices via their hooks.                │
│                                                                        │
│  CRITICAL: No Convex queries here - domains own their data            │
│  Dashboard = Shell + Composition                                       │
│                                                                        │
│  References: TTT~DASHBOARD-IMPLEMENTATION-DOCTRINE.md §Composition    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { useAdminData } from '@/hooks/useAdminData';
import { useProductivityData } from '@/hooks/useProductivityData';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useClientData } from '@/hooks/useClientData';
import { useProjectData } from '@/hooks/useProjectData';

/**
 * Dashboard Composition Hook
 *
 * Composes data from WARP-primed domain slices.
 * Returns dashboard UI preferences + aggregated stats.
 *
 * ZERO COUPLING: Dashboard never imports domain schemas.
 * If Finance schema changes, Dashboard code stays untouched (litmus test).
 *
 * Usage:
 * ```tsx
 * const { data, computed, actions, flags } = useDashboardData();
 * const { layout, visibleWidgets } = data;
 * const { stats } = computed;
 * ```
 */
export function useDashboardData() {
  // Dashboard UI state (owned by dashboard)
  const dashboard = useFuse((state) => state.dashboard);
  const rank = useFuse((state) => state.rank);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isDashboardHydrated = dashboard.status === 'hydrated';

  // WARP-primed domain data (owned by domains)
  const admin = useAdminData();
  const work = useProductivityData();
  const finance = useFinancialData();
  const client = useClientData();
  const project = useProjectData();

  return {
    // DATA: Dashboard UI preferences only
    data: {
      layout: dashboard.layout,
      visibleWidgets: dashboard.visibleWidgets,
      expandedSections: dashboard.expandedSections,
      status: dashboard.status,
    },

    // COMPUTED: Composed stats from domains (zero ownership)
    computed: {
      // Aggregate stats composed from domain hooks
      stats: {
        // Admin domain stats (Admiral only)
        totalUsers: admin.computed.usersCount,
        hasDeletionLogs: admin.computed.hasDeletionLogs,

        // Work domain stats (all ranks)
        unreadEmails: work.computed.totalEmails,
        upcomingEvents: work.computed.totalCalendarEvents,
        activeTasks: work.computed.totalTasks,

        // Finance domain stats (Captain+)
        totalInvoices: finance.computed.totalInvoices || 0,
        totalBills: finance.computed.totalBills || 0,
        totalTransactions: finance.computed.totalTransactions || 0,

        // Client domain stats (all ranks)
        totalClients: client.computed.totalContacts || 0,
        activeSessions: client.computed.totalSessions || 0,

        // Project domain stats (Captain+)
        activeProjects: project.computed.totalCharts || 0,
      },

      // Domain hydration status (for widget visibility)
      domainsReady: {
        admin: admin.flags.isHydrated,
        work: work.flags.isHydrated,
        finance: finance.flags.isHydrated,
        client: client.flags.isHydrated,
        project: project.flags.isHydrated,
      },

      // Rank-based widget availability
      availableWidgets: getAvailableWidgets(rank),
    },

    // ACTIONS: Dashboard UI actions only (no data mutations)
    actions: {
      // Will be provided by DashboardProvider
      // setLayout, toggleWidget, etc.
    },

    // FLAGS: Hydration and state flags (TTTS-1 compliant)
    flags: {
      isHydrated: isDashboardHydrated,
      isReady: dashboard.status === 'hydrated',
    },
  };
}

/**
 * Get available widgets based on user rank
 * Matches DEFAULT_WIDGETS_BY_RANK from dashboard slice
 */
function getAvailableWidgets(rank?: string): string[] {
  switch (rank) {
    case 'admiral':
      return ['admin-stats', 'system-health', 'work-inbox', 'client-activity'];
    case 'commodore':
      return ['portfolio-summary', 'work-inbox', 'client-activity', 'finance-overview', 'branding-status'];
    case 'captain':
      return ['work-inbox', 'client-activity', 'finance-overview', 'project-status'];
    case 'crew':
      return ['work-inbox', 'client-sessions'];
    default:
      return ['work-inbox']; // Safe fallback
  }
}

// Type export for components
export type DashboardData = ReturnType<typeof useDashboardData>;
