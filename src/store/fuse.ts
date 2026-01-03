/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FUSE STORE - PURE COMPOSITION
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This file is a PURE COMPOSITION LAYER.
 * - Imports slice creators
 * - Composes them into one store
 * - Exports the store
 * - NOTHING ELSE
 *
 * All behavior lives in slices. This file is boring by design.
 * If this file is interesting, it's wrong.
 *
 * References:
 *   - 04-ADP-PATTERN.md
 *   - 15-TTT-SUPPLEMENT.md
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Slice Imports
// ─────────────────────────────────────────────────────────────────────────────

import {
  // Core (user, genome, theme, UI)
  createCoreSlice,
  type CoreSlice,
  type CoreActions,
  // Sovereign Router
  createSovereignRouterSlice,
  type NavigationSlice,
  type NavigationActions,
  // Domain slices - these create flat slices, we namespace them
  createProductivitySlice,
  type ProductivitySlice,
  type ProductivityActions,
  createEmailBodyCacheSlice,
  type EmailBodyCacheSlice,
  type EmailBodyCacheActions,
  createAdminSlice,
  type AdminSlice,
  type AdminActions,
  createDashboardSlice,
  type DashboardSlice,
  type DashboardActions,
  createFinanceSlice,
  type FinanceSlice,
  type FinanceActions,
  createClientsSlice,
  type ClientsSlice,
  type ClientsActions,
  createProjectsSlice,
  type ProjectsSlice,
  type ProjectsActions,
  createSettingsSlice,
  type SettingsSlice,
  type SettingsActions,
  createSystemSlice,
  type SystemSlice,
  type SystemActions,
} from './domains';

// ─────────────────────────────────────────────────────────────────────────────
// Store Type Composition
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FuseStore maintains the existing API:
 * - state.user, state.genome, state.themeMode (core - flat)
 * - state.productivity.email (domains - namespaced)
 * - state.emailBodyCache.emailBodies (infrastructure - namespaced)
 * - state.sovereign.route (sovereign router - namespaced)
 */
interface FuseStore extends CoreSlice, CoreActions {
  // Domain slices - NAMESPACED for backwards compatibility
  productivity: ProductivitySlice;
  emailBodyCache: EmailBodyCacheSlice;
  admin: AdminSlice;
  dashboard: DashboardSlice;
  finance: FinanceSlice;
  clients: ClientsSlice;
  projects: ProjectsSlice;
  settings: SettingsSlice;
  system: SystemSlice;

  // Domain actions - at root level for convenience
  hydrateProductivity: ProductivityActions['hydrateProductivity'];
  updateEmailReadStatus: ProductivityActions['updateEmailReadStatus'];
  batchUpdateEmailReadStatus: ProductivityActions['batchUpdateEmailReadStatus'];
  removeEmailMessages: ProductivityActions['removeEmailMessages'];
  removeEmailFolder: ProductivityActions['removeEmailFolder'];
  clearPendingReadUpdate: ProductivityActions['clearPendingReadUpdate'];
  batchClearPendingReadUpdates: ProductivityActions['batchClearPendingReadUpdates'];
  addAutoMarkExempt: ProductivityActions['addAutoMarkExempt'];
  addAutoMarkExemptBatch: ProductivityActions['addAutoMarkExemptBatch'];
  removeAutoMarkExempt: ProductivityActions['removeAutoMarkExempt'];
  removeAutoMarkExemptBatch: ProductivityActions['removeAutoMarkExemptBatch'];
  clearProductivity: ProductivityActions['clearProductivity'];
  setEmailViewMode: ProductivityActions['setEmailViewMode'];

  hydrateEmailBody: EmailBodyCacheActions['hydrateEmailBody'];
  setEmailBodyStatus: EmailBodyCacheActions['setEmailBodyStatus'];
  clearBodiesForMessages: EmailBodyCacheActions['clearBodiesForMessages'];
  clearEmailBodyCache: EmailBodyCacheActions['clearEmailBodyCache'];

  hydrateAdmin: AdminActions['hydrateAdmin'];
  clearAdmin: AdminActions['clearAdmin'];

  hydrateDashboard: DashboardActions['hydrateDashboard'];
  clearDashboard: DashboardActions['clearDashboard'];
  setLayout: DashboardActions['setLayout'];
  toggleWidget: DashboardActions['toggleWidget'];

  hydrateFinance: FinanceActions['hydrateFinance'];
  clearFinance: FinanceActions['clearFinance'];

  hydrateClients: ClientsActions['hydrateClients'];
  clearClients: ClientsActions['clearClients'];

  hydrateProjects: ProjectsActions['hydrateProjects'];
  clearProjects: ProjectsActions['clearProjects'];

  hydrateSettings: SettingsActions['hydrateSettings'];
  clearSettings: SettingsActions['clearSettings'];

  hydrateSystem: SystemActions['hydrateSystem'];
  clearSystem: SystemActions['clearSystem'];

  // Sovereign Router - namespaced
  sovereign: NavigationSlice;
  navigate: NavigationActions['navigate'];
  goBack: NavigationActions['goBack'];
  sovereignToggleSection: NavigationActions['toggleSection'];
  sovereignCollapseAll: NavigationActions['collapseAllSections'];
  sovereignHydrateSections: NavigationActions['hydrateExpandedSections'];
  sovereignToggleSidebar: NavigationActions['toggleSidebar'];
}

// ─────────────────────────────────────────────────────────────────────────────
// Namespace Wrapper Helper
// ─────────────────────────────────────────────────────────────────────────────

import type { StateCreator } from 'zustand';

type SliceCreator<T> = StateCreator<T, [], [], T>;

/**
 * Wraps a slice creator to scope its set/get to a namespace.
 * This allows slices to operate on their own state without knowing about the root.
 *
 * TTT BOUNDARY: Single, explicit, documented type-erasure point.
 * Zustand's StateCreator generics cannot be fully typed across middleware stacks.
 * This is an acceptable pattern used in Redux, TanStack Query, and Zustand middleware itself.
 */
function createNamespacedSlice<T extends object>(
  namespace: string,
  sliceCreator: SliceCreator<T>,
  rootSet: (fn: (state: Record<string, unknown>) => Record<string, unknown>) => void,
  rootGet: () => Record<string, unknown>,
  store: unknown
): T {
  const namespacedSet = (partial: Partial<T> | ((state: T) => Partial<T>)) => {
    if (typeof partial === 'function') {
      rootSet((state) => {
        const sliceState = state[namespace] as T;
        return { [namespace]: { ...sliceState, ...partial(sliceState) } };
      });
    } else {
      rootSet((state) => ({ [namespace]: { ...(state[namespace] as T), ...partial } }));
    }
  };
  const namespacedGet = () => rootGet()[namespace] as T;
  // SINGLE TYPE-ERASURE POINT: Zustand's store param cannot be generically typed
  return sliceCreator(namespacedSet as never, namespacedGet as never, store as never);
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Creation
// ─────────────────────────────────────────────────────────────────────────────

export const useFuse = create<FuseStore>()((set, get, store): FuseStore => {
  // Core slice - flat at root
  const coreSlice = createCoreSlice(
    set as Parameters<typeof createCoreSlice>[0],
    get as Parameters<typeof createCoreSlice>[1],
    store as Parameters<typeof createCoreSlice>[2]
  );

  // Domain slices - namespaced (TTT BOUNDARY: type erasure at composition layer)
  const productivitySlice = createNamespacedSlice('productivity', createProductivitySlice, set as never, get as never, store);
  const emailBodyCacheSlice = createNamespacedSlice('emailBodyCache', createEmailBodyCacheSlice, set as never, get as never, store);
  const adminSlice = createNamespacedSlice('admin', createAdminSlice, set as never, get as never, store);
  const dashboardSlice = createNamespacedSlice('dashboard', createDashboardSlice, set as never, get as never, store);
  const financeSlice = createNamespacedSlice('finance', createFinanceSlice, set as never, get as never, store);
  const clientsSlice = createNamespacedSlice('clients', createClientsSlice, set as never, get as never, store);
  const projectsSlice = createNamespacedSlice('projects', createProjectsSlice, set as never, get as never, store);
  const settingsSlice = createNamespacedSlice('settings', createSettingsSlice, set as never, get as never, store);
  const systemSlice = createNamespacedSlice('system', createSystemSlice, set as never, get as never, store);
  const sovereignSlice = createNamespacedSlice('sovereign', createSovereignRouterSlice, set as never, get as never, store);

  return {
    // Core slice (flat at root)
    ...coreSlice,

    // Domain state (namespaced)
    productivity: {
      email: productivitySlice.email,
      calendar: productivitySlice.calendar,
      meetings: productivitySlice.meetings,
      bookings: productivitySlice.bookings,
      tasks: productivitySlice.tasks,
      emailViewMode: productivitySlice.emailViewMode,
      pendingReadUpdates: productivitySlice.pendingReadUpdates,
      autoMarkExemptIds: productivitySlice.autoMarkExemptIds,
      status: productivitySlice.status,
      lastFetchedAt: productivitySlice.lastFetchedAt,
      source: productivitySlice.source,
    },
    emailBodyCache: {
      emailBodies: emailBodyCacheSlice.emailBodies,
      emailBodyStatus: emailBodyCacheSlice.emailBodyStatus,
      emailBodyOrder: emailBodyCacheSlice.emailBodyOrder,
    },
    admin: {
      users: adminSlice.users,
      deletionLogs: adminSlice.deletionLogs,
      clerkRegistryCount: adminSlice.clerkRegistryCount,
      status: adminSlice.status,
      lastFetchedAt: adminSlice.lastFetchedAt,
      source: adminSlice.source,
    },
    dashboard: {
      layout: dashboardSlice.layout,
      visibleWidgets: dashboardSlice.visibleWidgets,
      expandedSections: dashboardSlice.expandedSections,
      status: dashboardSlice.status,
      lastFetchedAt: dashboardSlice.lastFetchedAt,
      source: dashboardSlice.source,
    },
    finance: {
      businessProfile: financeSlice.businessProfile,
      categories: financeSlice.categories,
      accounts: financeSlice.accounts,
      transactions: financeSlice.transactions,
      patterns: financeSlice.patterns,
      customers: financeSlice.customers,
      quotes: financeSlice.quotes,
      invoices: financeSlice.invoices,
      suppliers: financeSlice.suppliers,
      purchases: financeSlice.purchases,
      bills: financeSlice.bills,
      chartOfAccounts: financeSlice.chartOfAccounts,
      fixedAssets: financeSlice.fixedAssets,
      employees: financeSlice.employees,
      payrollRuns: financeSlice.payrollRuns,
      status: financeSlice.status,
      lastFetchedAt: financeSlice.lastFetchedAt,
      source: financeSlice.source,
    },
    clients: {
      contacts: clientsSlice.contacts,
      teams: clientsSlice.teams,
      sessions: clientsSlice.sessions,
      reports: clientsSlice.reports,
      status: clientsSlice.status,
      lastFetchedAt: clientsSlice.lastFetchedAt,
      source: clientsSlice.source,
    },
    projects: {
      charts: projectsSlice.charts,
      locations: projectsSlice.locations,
      tracking: projectsSlice.tracking,
      status: projectsSlice.status,
      lastFetchedAt: projectsSlice.lastFetchedAt,
      source: projectsSlice.source,
    },
    settings: {
      userProfile: settingsSlice.userProfile,
      preferences: settingsSlice.preferences,
      notifications: settingsSlice.notifications,
      status: settingsSlice.status,
      lastFetchedAt: settingsSlice.lastFetchedAt,
      source: settingsSlice.source,
    },
    system: {
      users: systemSlice.users,
      ranks: systemSlice.ranks,
      aiConfig: systemSlice.aiConfig,
      status: systemSlice.status,
      lastFetchedAt: systemSlice.lastFetchedAt,
      source: systemSlice.source,
    },
    sovereign: {
      route: sovereignSlice.route,
      history: sovereignSlice.history,
      lastNavigatedAt: sovereignSlice.lastNavigatedAt,
      expandedSections: sovereignSlice.expandedSections,
      sidebarCollapsed: sovereignSlice.sidebarCollapsed,
    },

    // Productivity actions
    hydrateProductivity: productivitySlice.hydrateProductivity,
    updateEmailReadStatus: productivitySlice.updateEmailReadStatus,
    batchUpdateEmailReadStatus: productivitySlice.batchUpdateEmailReadStatus,
    removeEmailMessages: productivitySlice.removeEmailMessages,
    removeEmailFolder: productivitySlice.removeEmailFolder,
    clearPendingReadUpdate: productivitySlice.clearPendingReadUpdate,
    batchClearPendingReadUpdates: productivitySlice.batchClearPendingReadUpdates,
    addAutoMarkExempt: productivitySlice.addAutoMarkExempt,
    addAutoMarkExemptBatch: productivitySlice.addAutoMarkExemptBatch,
    removeAutoMarkExempt: productivitySlice.removeAutoMarkExempt,
    removeAutoMarkExemptBatch: productivitySlice.removeAutoMarkExemptBatch,
    clearProductivity: productivitySlice.clearProductivity,
    setEmailViewMode: productivitySlice.setEmailViewMode,

    // Email body cache actions
    hydrateEmailBody: emailBodyCacheSlice.hydrateEmailBody,
    setEmailBodyStatus: emailBodyCacheSlice.setEmailBodyStatus,
    clearBodiesForMessages: emailBodyCacheSlice.clearBodiesForMessages,
    clearEmailBodyCache: emailBodyCacheSlice.clearEmailBodyCache,

    // Admin actions
    hydrateAdmin: adminSlice.hydrateAdmin,
    clearAdmin: adminSlice.clearAdmin,

    // Dashboard actions
    hydrateDashboard: dashboardSlice.hydrateDashboard,
    clearDashboard: dashboardSlice.clearDashboard,
    setLayout: dashboardSlice.setLayout,
    toggleWidget: dashboardSlice.toggleWidget,

    // Finance actions
    hydrateFinance: financeSlice.hydrateFinance,
    clearFinance: financeSlice.clearFinance,

    // Clients actions
    hydrateClients: clientsSlice.hydrateClients,
    clearClients: clientsSlice.clearClients,

    // Projects actions
    hydrateProjects: projectsSlice.hydrateProjects,
    clearProjects: projectsSlice.clearProjects,

    // Settings actions
    hydrateSettings: settingsSlice.hydrateSettings,
    clearSettings: settingsSlice.clearSettings,

    // System actions
    hydrateSystem: systemSlice.hydrateSystem,
    clearSystem: systemSlice.clearSystem,

    // Sovereign Router actions
    navigate: sovereignSlice.navigate,
    goBack: sovereignSlice.goBack,
    sovereignToggleSection: sovereignSlice.toggleSection,
    sovereignCollapseAll: sovereignSlice.collapseAllSections,
    sovereignHydrateSections: sovereignSlice.hydrateExpandedSections,
    sovereignToggleSidebar: sovereignSlice.toggleSidebar,
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// Client-Side Route Initialization
// ─────────────────────────────────────────────────────────────────────────────

// FOUC Prevention: Patch initial route from localStorage immediately after store creation
if (typeof window !== 'undefined') {
  const initialRoute = localStorage.getItem('fuse-initial-route');
  if (initialRoute && initialRoute !== 'dashboard') {
    useFuse.setState((state) => ({
      sovereign: { ...state.sovereign, route: initialRoute },
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type { FuseStore };
export type { DomainRoute, NavigationSlice } from './domains';
