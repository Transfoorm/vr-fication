/**
 * ══════════════════════════════════════════════════════════════════════════════
 * FUSE STORE - THE ORCHESTRATOR
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This file is a PURE ORCHESTRATOR that manages all application state.
 * Domain TYPE definitions live in ./domains/ for single source of truth.
 *
 * THE STANDARD:
 *   - Domain types are defined in src/store/domains/
 *   - Each domain has status: 'idle' | 'loading' | 'hydrated' | 'error'
 *   - status === 'hydrated' means data is ready (NO separate isXHydrated booleans)
 *   - ONE source of truth
 *
 * References:
 *   - 04-ADP-PATTERN.md
 *   - 15-TTT-SUPPLEMENT.md
 * ══════════════════════════════════════════════════════════════════════════════
 */

'use client';

import { create } from 'zustand';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';

// Domain type imports - Types defined in ./domains/ for single source of truth
import {
  fuseTimer,
  type ProductivitySlice,
  type ProductivityData,
  type AdminSlice,
  type AdminData,
  type DashboardSlice,
  type DashboardData,
  type FinanceSlice,
  type FinanceData,
  type ClientsSlice,
  type ClientsData,
  type ProjectsSlice,
  type ProjectsData,
  type SettingsSlice,
  type SettingsData,
  type SystemSlice,
  type SystemData,
  type ADPSource,
  // 🔱 SOVEREIGN ROUTER
  type NavigationSlice,
} from './domains';

// Core types
import type {
  FuseUser,
  GenomeData,
  ThemeName,
  ThemeMode,
  UserRank,
  NavigationState,
  AISidebarState,
} from '@/store/types';

import { THEME_DEFAULTS, STORAGE_KEYS, DOM_ATTRIBUTES } from '@/fuse/constants/coreThemeConfig';
import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

// ══════════════════════════════════════════════════════════════════════════════
// Convex Client
// ══════════════════════════════════════════════════════════════════════════════

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ══════════════════════════════════════════════════════════════════════════════
// Store Type
// ══════════════════════════════════════════════════════════════════════════════

interface FuseStore {
  // ─────────────────────────────────────────────────────────────────────────────
  // Core State
  // ─────────────────────────────────────────────────────────────────────────────
  user: FuseUser;
  genome: GenomeData;
  rank: UserRank | undefined;
  isHydrated: boolean;
  themeMode: ThemeMode;
  themeName: ThemeName;
  navigation: NavigationState; // Legacy - being replaced by sovereign router
  aiSidebarState: AISidebarState;
  modalSkipped: boolean;
  modalReturning: boolean;
  phoenixButtonVisible: boolean;
  phoenixNavigating: boolean;
  shadowKingActive: boolean;
  showRedArrow: boolean;
  lastActionTiming?: number;
  navClickTime?: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔱 SOVEREIGN ROUTER - FUSE 6.0
  // ─────────────────────────────────────────────────────────────────────────────
  sovereign: NavigationSlice;

  // ─────────────────────────────────────────────────────────────────────────────
  // Domain Slices (types from ./domains/)
  // ─────────────────────────────────────────────────────────────────────────────
  productivity: ProductivitySlice;
  admin: AdminSlice;
  dashboard: DashboardSlice;
  finance: FinanceSlice;
  clients: ClientsSlice;
  projects: ProjectsSlice;
  settings: SettingsSlice;
  system: SystemSlice;

  // ─────────────────────────────────────────────────────────────────────────────
  // Core Actions
  // ─────────────────────────────────────────────────────────────────────────────
  setUser: (user: FuseUser | null) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<NonNullable<FuseUser>>) => void;
  /** Update user profile with optimistic UI + Server Action sync (TTT-LiveField pattern) */
  updateUserLocal: (updates: Partial<NonNullable<FuseUser>>) => Promise<void>;
  /** Update Miror AI settings with optimistic UI + Server Action sync */
  updateMirorLocal: (updates: {
    mirorAvatarProfile?: AvatarOption;
    mirorEnchantmentEnabled?: boolean;
    mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
  }) => Promise<void>;

  // Genome actions
  /** Hydrate genome from query */
  hydrateGenome: (data: GenomeData) => void;
  /** Update genome with optimistic UI (for Field.live auto-save) */
  updateGenomeLocal: (updates: Partial<NonNullable<GenomeData>>) => Promise<void>;

  hydrateThemeMode: (mode: ThemeMode) => void;
  hydrateThemeName: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeName: (name: ThemeName) => Promise<void>;
  toggleThemeMode: () => void;
  // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
  syncThemeFromDB: (userId: string) => Promise<void>;

  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  setPendingRoute: (route: string | null) => void;
  toggleSidebar: () => void;
  setActiveSection: (section?: string) => void;
  toggleSection: (sectionId: string) => void;
  hydrateExpandedSections: () => void;
  collapseAllSections: () => void;
  expandAllSections: (sectionIds?: string[]) => void;

  setAISidebarState: (state: AISidebarState) => void;

  setModalSkipped: (value: boolean) => void;
  setModalReturning: (value: boolean) => void;
  setPhoenixButtonVisible: (value: boolean) => void;
  setPhoenixNavigating: (value: boolean) => void;
  setShadowKingActive: (value: boolean) => void;
  setShowRedArrow: (value: boolean) => void;

  // Navigation timing - click-to-render measurement
  setNavClickTime: () => void;
  clearNavClickTime: () => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // 🔱 SOVEREIGN ROUTER ACTIONS - FUSE 6.0
  // ─────────────────────────────────────────────────────────────────────────────
  /** Navigate to a route - THE SOVEREIGN COMMAND */
  navigate: (route: string) => void;
  /** Go back to previous route */
  goBack: () => void;
  /** Toggle sidebar section */
  sovereignToggleSection: (sectionId: string) => void;
  /** Collapse all sections */
  sovereignCollapseAll: () => void;
  /** Hydrate sections from localStorage */
  sovereignHydrateSections: () => void;
  /** Toggle sidebar collapsed */
  sovereignToggleSidebar: () => void;

  // ─────────────────────────────────────────────────────────────────────────────
  // Domain Actions
  // ─────────────────────────────────────────────────────────────────────────────
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
  clearProductivity: () => void;
  setEmailViewMode: (mode: 'standard' | 'await') => void;

  hydrateAdmin: (data: Partial<AdminData>, source?: ADPSource) => void;
  clearAdmin: () => void;

  hydrateDashboard: (data: Partial<DashboardData>, source?: ADPSource) => void;
  clearDashboard: () => void;
  setLayout: (layout: 'classic' | 'focus' | 'metrics') => void;
  toggleWidget: (widgetId: string) => void;

  hydrateFinance: (data: Partial<FinanceData>, source?: ADPSource) => void;
  clearFinance: () => void;

  hydrateClients: (data: Partial<ClientsData>, source?: ADPSource) => void;
  clearClients: () => void;

  hydrateProjects: (data: Partial<ProjectsData>, source?: ADPSource) => void;
  clearProjects: () => void;

  hydrateSettings: (data: Partial<SettingsData>, source?: ADPSource) => void;
  clearSettings: () => void;

  hydrateSystem: (data: Partial<SystemData>, source?: ADPSource) => void;
  clearSystem: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// THE FUSE STORE
// ══════════════════════════════════════════════════════════════════════════════

export const useFuse = create<FuseStore>()((set, get) => {
  return {
    // ════════════════════════════════════════════════════════════════════════
    // CORE STATE
    // ════════════════════════════════════════════════════════════════════════

    user: null,
    genome: null,
    rank: undefined,
    isHydrated: false,
    themeMode: THEME_DEFAULTS.DEFAULT_MODE,
    themeName: THEME_DEFAULTS.DEFAULT_THEME,

    navigation: {
      currentRoute: '',
      breadcrumbs: [],
      sidebarCollapsed: false,
      activeSection: undefined,
      expandedSections: [],
      pendingRoute: null,
    },

    aiSidebarState: 'closed',
    modalSkipped: false,
    modalReturning: false,
    phoenixButtonVisible: false,
    phoenixNavigating: false,
    shadowKingActive: false,
    showRedArrow: false,
    lastActionTiming: undefined,
    navClickTime: undefined,

    // ════════════════════════════════════════════════════════════════════════
    // 🔱 SOVEREIGN ROUTER STATE - FUSE 6.0
    // Note: Route is set to 'dashboard' here for SSR. On client, the store
    // is patched immediately below (after create) with the correct route.
    // ════════════════════════════════════════════════════════════════════════
    sovereign: {
      route: 'dashboard',
      history: [],
      lastNavigatedAt: 0,
      expandedSections: [],
      sidebarCollapsed: false,
    },

    // ════════════════════════════════════════════════════════════════════════
    // DOMAIN SLICES (state only - actions are spread below)
    // ════════════════════════════════════════════════════════════════════════

    productivity: {
      email: undefined,
      calendar: [],
      meetings: [],
      bookings: [],
      tasks: [],
      emailViewMode: 'standard',
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    admin: {
      users: [],
      deletionLogs: [],
      clerkRegistryCount: 0,
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    dashboard: {
      layout: 'classic',
      visibleWidgets: [],
      expandedSections: [],
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    finance: {
      businessProfile: null,
      categories: [],
      accounts: [],
      transactions: [],
      patterns: [],
      customers: [],
      quotes: [],
      invoices: [],
      suppliers: [],
      purchases: [],
      bills: [],
      chartOfAccounts: [],
      fixedAssets: [],
      employees: [],
      payrollRuns: [],
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    clients: {
      contacts: [],
      teams: [],
      sessions: [],
      reports: [],
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    projects: {
      charts: [],
      locations: [],
      tracking: [],
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    settings: {
      userProfile: null,
      preferences: [],
      notifications: [],
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    system: {
      users: [],
      ranks: [],
      aiConfig: null,
      status: 'idle',
      lastFetchedAt: undefined,
      source: undefined,
    },

    // ════════════════════════════════════════════════════════════════════════
    // DOMAIN ACTIONS
    // ════════════════════════════════════════════════════════════════════════

    // Productivity
    hydrateProductivity: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateProductivity');
      set((state) => ({
        productivity: {
          ...state.productivity,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`📅 FUSE: Productivity hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateProductivity', start);
    },
    clearProductivity: () => {
      const start = fuseTimer.start('clearProductivity');
      set({
        productivity: {
          email: undefined,
          calendar: [],
          meetings: [],
          bookings: [],
          tasks: [],
          emailViewMode: 'standard',
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearProductivity', start);
    },
    setEmailViewMode: (mode) => {
      set((state) => ({
        productivity: {
          ...state.productivity,
          emailViewMode: mode,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ FUSE: Email view mode changed to ${mode}`);
      }
    },

    // Admin
    hydrateAdmin: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateAdmin');
      set((state) => ({
        admin: {
          ...state.admin,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`👑 FUSE: Admin hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateAdmin', start);
    },
    clearAdmin: () => {
      const start = fuseTimer.start('clearAdmin');
      set({
        admin: {
          users: [],
          deletionLogs: [],
          clerkRegistryCount: 0,
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearAdmin', start);
    },

    // Dashboard
    hydrateDashboard: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateDashboard');
      set((state) => ({
        dashboard: {
          ...state.dashboard,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 FUSE: Dashboard hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateDashboard', start);
    },
    clearDashboard: () => {
      const start = fuseTimer.start('clearDashboard');
      set({
        dashboard: {
          layout: 'classic',
          visibleWidgets: [],
          expandedSections: [],
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearDashboard', start);
    },
    setLayout: (layout) => {
      set((state) => ({
        dashboard: { ...state.dashboard, layout },
      }));
    },
    toggleWidget: (widgetId) => {
      set((state) => {
        const isVisible = state.dashboard.visibleWidgets.includes(widgetId);
        return {
          dashboard: {
            ...state.dashboard,
            visibleWidgets: isVisible
              ? state.dashboard.visibleWidgets.filter((id) => id !== widgetId)
              : [...state.dashboard.visibleWidgets, widgetId],
          },
        };
      });
    },

    // Finance
    hydrateFinance: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateFinance');
      set((state) => ({
        finance: {
          ...state.finance,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`💰 FUSE: Finance hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateFinance', start);
    },
    clearFinance: () => {
      const start = fuseTimer.start('clearFinance');
      set({
        finance: {
          businessProfile: null,
          categories: [],
          accounts: [],
          transactions: [],
          patterns: [],
          customers: [],
          quotes: [],
          invoices: [],
          suppliers: [],
          purchases: [],
          bills: [],
          chartOfAccounts: [],
          fixedAssets: [],
          employees: [],
          payrollRuns: [],
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearFinance', start);
    },

    // Clients
    hydrateClients: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateClients');
      set((state) => ({
        clients: {
          ...state.clients,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`👥 FUSE: Clients hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateClients', start);
    },
    clearClients: () => {
      const start = fuseTimer.start('clearClients');
      set({
        clients: {
          contacts: [],
          teams: [],
          sessions: [],
          reports: [],
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearClients', start);
    },

    // Projects
    hydrateProjects: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateProjects');
      set((state) => ({
        projects: {
          ...state.projects,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`📋 FUSE: Projects hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateProjects', start);
    },
    clearProjects: () => {
      const start = fuseTimer.start('clearProjects');
      set({
        projects: {
          charts: [],
          locations: [],
          tracking: [],
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearProjects', start);
    },

    // Settings
    hydrateSettings: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateSettings');
      set((state) => ({
        settings: {
          ...state.settings,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚙️ FUSE: Settings hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateSettings', start);
    },
    clearSettings: () => {
      const start = fuseTimer.start('clearSettings');
      set({
        settings: {
          userProfile: null,
          preferences: [],
          notifications: [],
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearSettings', start);
    },

    // System
    hydrateSystem: (data, source = 'WARP') => {
      const start = fuseTimer.start('hydrateSystem');
      set((state) => ({
        system: {
          ...state.system,
          ...data,
          status: 'hydrated',  // TTTS-1 compliant
          lastFetchedAt: Date.now(),
          source,
        },
      }));
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 FUSE: System hydrated via ${source}`, data);
      }
      fuseTimer.end('hydrateSystem', start);
    },
    clearSystem: () => {
      const start = fuseTimer.start('clearSystem');
      set({
        system: {
          users: [],
          ranks: [],
          aiConfig: null,
          status: 'idle',
          lastFetchedAt: undefined,
          source: undefined,
        },
      });
      fuseTimer.end('clearSystem', start);
    },

    // ════════════════════════════════════════════════════════════════════════
    // CORE ACTIONS
    // ════════════════════════════════════════════════════════════════════════

    setUser: (user: FuseUser | null) => {
      const start = fuseTimer.start('setUser');

      // DEV-TIME SOVEREIGNTY GUARD
      if (process.env.NODE_ENV === 'development' && user?.id) {
        if (user.id.startsWith('user_')) {
          console.error(
            '⛔ SOVEREIGNTY VIOLATION DETECTED:\n' +
            `user.id="${user.id}" appears to be a Clerk ID.\n` +
            'Convex _id must be used as canonical identity.\n' +
            'Fix: Ensure session minting passes _id to cookie payload.'
          );
        }
      }

      const rank = user?.rank as UserRank | undefined;
      set({ user, rank, isHydrated: true, lastActionTiming: performance.now() });
      fuseTimer.end('setUser', start);
    },

    clearUser: () => {
      const start = fuseTimer.start('clearUser');
      set({ user: null, rank: undefined, lastActionTiming: performance.now() });
      fuseTimer.end('clearUser', start);
    },

    updateUser: (updates: Partial<NonNullable<FuseUser>>) => {
      const start = fuseTimer.start('updateUser');
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...updates } : null;
        const rank = updatedUser?.rank as UserRank | undefined;
        return { user: updatedUser, rank, lastActionTiming: performance.now() };
      });
      fuseTimer.end('updateUser', start);
    },

    /**
     * Update user profile settings with optimistic UI + Server Action sync
     *
     * TTT-LiveField Pattern: onBlur → this action → optimistic update → Server Action
     * Server Action handles: auth, Convex mutation, cookie refresh
     *
     * Flow: Component onBlur → FUSE action → optimistic update + Server Action
     */
    updateUserLocal: async (updates: Partial<NonNullable<FuseUser>>) => {
      const start = fuseTimer.start('updateUserLocal');

      // 1. Optimistic update (instant UI feedback)
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...updates } : null;
        const rank = updatedUser?.rank as UserRank | undefined;
        return { user: updatedUser, rank, lastActionTiming: performance.now() };
      });

      // 2. Persist via Server Action (handles auth + cookie refresh)
      // Filter to only profile fields and convert null to undefined
      const profileUpdates: {
        firstName?: string;
        lastName?: string;
        entityName?: string;
        socialName?: string;
        phoneNumber?: string;
        businessCountry?: string;
      } = {};

      if ('firstName' in updates && updates.firstName !== null) {
        profileUpdates.firstName = updates.firstName ?? undefined;
      }
      if ('lastName' in updates && updates.lastName !== null) {
        profileUpdates.lastName = updates.lastName ?? undefined;
      }
      if ('entityName' in updates && updates.entityName !== null) {
        profileUpdates.entityName = updates.entityName ?? undefined;
      }
      if ('socialName' in updates && updates.socialName !== null) {
        profileUpdates.socialName = updates.socialName ?? undefined;
      }
      if ('phoneNumber' in updates && updates.phoneNumber !== null) {
        profileUpdates.phoneNumber = updates.phoneNumber ?? undefined;
      }
      if ('businessCountry' in updates && updates.businessCountry !== null) {
        profileUpdates.businessCountry = updates.businessCountry ?? undefined;
      }

      if (Object.keys(profileUpdates).length > 0) {
        const { updateProfileAction } = await import('@/app/actions/user-mutations');
        const result = await updateProfileAction(profileUpdates);
        if (!result.success) {
          throw new Error(result.error || 'Failed to save');
        }
      }

      fuseTimer.end('updateUserLocal', start);
    },

    /**
     * Update Miror AI settings with optimistic UI + Server Action sync
     */
    updateMirorLocal: async (updates: {
      mirorAvatarProfile?: AvatarOption;
      mirorEnchantmentEnabled?: boolean;
      mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
    }) => {
      const start = fuseTimer.start('updateMirorLocal');

      // 1. Optimistic update (instant UI feedback)
      set((state) => {
        const updatedUser = state.user ? { ...state.user, ...updates } : null;
        return { user: updatedUser, lastActionTiming: performance.now() };
      });

      // 2. Persist via Server Action (handles auth + cookie refresh)
      const { updateMirorAction } = await import('@/app/actions/user-mutations');
      const result = await updateMirorAction(updates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save Miror settings');
      }

      fuseTimer.end('updateMirorLocal', start);
    },

    // ────────────────────────────────────────────────────────────────────────
    // Genome Actions
    // ────────────────────────────────────────────────────────────────────────

    hydrateGenome: (data: GenomeData) => {
      const start = fuseTimer.start('hydrateGenome');
      set({ genome: data, lastActionTiming: performance.now() });
      if (process.env.NODE_ENV === 'development') {
        console.log('🧬 FUSE: Genome hydrated', data);
      }
      fuseTimer.end('hydrateGenome', start);
    },

    updateGenomeLocal: async (updates: Partial<NonNullable<GenomeData>>) => {
      const start = fuseTimer.start('updateGenomeLocal');

      // 1. Optimistic update (instant UI feedback)
      set((state) => {
        const currentGenome = state.genome || { completionPercent: 0 };
        const newGenome = { ...currentGenome, ...updates };

        // Calculate completion percent client-side (mirrors Convex logic)
        const fields = [
          'jobTitle', 'department', 'seniority',
          'industry', 'companySize', 'companyWebsite',
          'transformationGoal', 'transformationStage', 'transformationType', 'timelineUrgency',
          'howDidYouHearAboutUs', 'teamSize', 'annualRevenue', 'successMetric'
        ] as const;

        let filled = 0;
        for (const field of fields) {
          const value = newGenome[field];
          if (value !== undefined && value !== null && value !== '') {
            filled++;
          }
        }
        const completionPercent = Math.round((filled / fields.length) * 100);

        return {
          genome: { ...newGenome, completionPercent },
          lastActionTiming: performance.now(),
        };
      });

      // 2. Persist via Server Action (handles auth)
      // Filter out null values and completionPercent (calculated server-side)
      const actionUpdates: Record<string, string | number | undefined> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (key !== 'completionPercent' && value !== null) {
          actionUpdates[key] = value as string | number | undefined;
        }
      }

      const { updateGenomeAction } = await import('@/app/actions/user-mutations');
      const result = await updateGenomeAction(actionUpdates);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save genome');
      }

      fuseTimer.end('updateGenomeLocal', start);
    },

    hydrateThemeMode: (mode) => {
      const start = fuseTimer.start('hydrateThemeMode');
      set({ themeMode: mode, lastActionTiming: performance.now() });

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_MODE, mode);
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, 'transtheme');
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      }

      fuseTimer.end('hydrateThemeMode', start);
    },

    hydrateThemeName: (name: ThemeName) => {
      const start = fuseTimer.start('hydrateThemeName');
      set({ themeName: name, lastActionTiming: performance.now() });

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, name);
        localStorage.setItem(STORAGE_KEYS.THEME_NAME, name);
      }

      fuseTimer.end('hydrateThemeName', start);
    },

    setThemeMode: async (mode) => {
      const start = fuseTimer.start('setThemeMode');
      set({ themeMode: mode, lastActionTiming: performance.now() });

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_MODE, mode);
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, 'transtheme');
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      }

      const { user } = get();
      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      if (user?.id) {
        try {
          await convex.mutation(api.domains.admin.users.api.updateThemePreferences, {
            userId: user.id as import('@/convex/_generated/dataModel').Id<"admin_users">,
            themeDark: mode === 'dark'
          });
        } catch (error) {
          console.error('Failed to sync theme to database:', error);
        }
      }

      fuseTimer.end('setThemeMode', start);
    },

    setThemeName: async (name: ThemeName) => {
      const start = fuseTimer.start('setThemeName');
      set({ themeName: name, lastActionTiming: performance.now() });

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, name);
        localStorage.setItem(STORAGE_KEYS.THEME_NAME, name);
      }

      const { user, themeMode } = get();
      // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
      if (user?.id) {
        try {
          await convex.mutation(api.domains.admin.users.api.updateThemePreferences, {
            userId: user.id as import('@/convex/_generated/dataModel').Id<"admin_users">,
            themeName: name,
            themeDark: themeMode === 'dark'
          });
        } catch (error) {
          console.error('Failed to sync theme name to database:', error);
        }
      }

      fuseTimer.end('setThemeName', start);
    },

    // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
    syncThemeFromDB: async (userId: string) => {
      const start = fuseTimer.start('syncThemeFromDB');

      try {
        const preferences = await convex.query(api.domains.admin.users.api.getUserThemePreferences, {
          userId: userId as import('@/convex/_generated/dataModel').Id<"admin_users">
        });

        if (preferences) {
          const mode = preferences.themeDark ? 'dark' : 'light';
          set({ themeMode: mode, themeName: 'transtheme', lastActionTiming: performance.now() });

          if (typeof window !== 'undefined') {
            document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_MODE, mode);
            document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, 'transtheme');
            localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
          }
        }
      } catch (error) {
        console.error('Failed to sync theme from database:', error);
        if (typeof window !== 'undefined') {
          const savedMode = localStorage.getItem(STORAGE_KEYS.THEME_MODE) as ThemeMode | null;
          if (savedMode) {
            set({ themeMode: savedMode, themeName: 'transtheme', lastActionTiming: performance.now() });
          }
        }
      }

      fuseTimer.end('syncThemeFromDB', start);
    },

    toggleThemeMode: () => {
      const start = fuseTimer.start('toggleThemeMode');
      const currentMode = get().themeMode;
      const newMode = currentMode === 'light' ? 'dark' : 'light';

      // 1. Update store immediately (optimistic)
      set({ themeMode: newMode, lastActionTiming: performance.now() });

      // 2. Update DOM + localStorage immediately
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_MODE, newMode);
        document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, 'transtheme');
        localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
      }

      // 3. Fire-and-forget: sync to DB in background (don't await)
      const { user } = get();
      if (user?.clerkId) {
        import('@/app/actions/user-mutations').then(({ updateThemeAction }) => {
          updateThemeAction(newMode === 'dark').catch((error) => {
            console.error('Failed to sync theme to database:', error);
          });
        });
      }

      fuseTimer.end('toggleThemeMode', start);
    },

    // Navigation methods
    setCurrentRoute: (route: string) => {
      const start = fuseTimer.start('setCurrentRoute');
      set((state) => ({
        navigation: { ...state.navigation, currentRoute: route },
        lastActionTiming: performance.now()
      }));
      fuseTimer.end('setCurrentRoute', start);
    },

    setBreadcrumbs: (breadcrumbs: string[]) => {
      const start = fuseTimer.start('setBreadcrumbs');
      set((state) => ({
        navigation: { ...state.navigation, breadcrumbs },
        lastActionTiming: performance.now()
      }));
      fuseTimer.end('setBreadcrumbs', start);
    },

    setPendingRoute: (route: string | null) => {
      const start = fuseTimer.start('setPendingRoute');
      set((state) => ({
        navigation: { ...state.navigation, pendingRoute: route },
        lastActionTiming: performance.now()
      }));
      fuseTimer.end('setPendingRoute', start);
    },

    toggleSidebar: () => {
      const start = fuseTimer.start('toggleSidebar');
      set((state) => ({
        navigation: { ...state.navigation, sidebarCollapsed: !state.navigation.sidebarCollapsed },
        lastActionTiming: performance.now()
      }));
      fuseTimer.end('toggleSidebar', start);
    },

    setActiveSection: (section?: string) => {
      const start = fuseTimer.start('setActiveSection');
      set((state) => ({
        navigation: { ...state.navigation, activeSection: section },
        lastActionTiming: performance.now()
      }));
      fuseTimer.end('setActiveSection', start);
    },

    toggleSection: (sectionId: string) => {
      const start = fuseTimer.start('toggleSection');
      set((state) => {
        const isExpanded = state.navigation.expandedSections.includes(sectionId);
        const newExpandedSections = isExpanded
          ? state.navigation.expandedSections.filter(id => id !== sectionId)
          : [...state.navigation.expandedSections, sectionId];

        if (typeof window !== 'undefined') {
          localStorage.setItem('sidebar-expanded-sections', JSON.stringify(newExpandedSections));
        }

        return {
          navigation: { ...state.navigation, expandedSections: newExpandedSections },
          lastActionTiming: performance.now()
        };
      });
      fuseTimer.end('toggleSection', start);
    },

    hydrateExpandedSections: () => {
      const start = fuseTimer.start('hydrateExpandedSections');
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sidebar-expanded-sections');
        if (stored) {
          try {
            const expandedSections = JSON.parse(stored);
            set((state) => ({
              navigation: { ...state.navigation, expandedSections },
              lastActionTiming: performance.now()
            }));
          } catch (error) {
            console.error('Failed to parse expanded sections from localStorage:', error);
          }
        }
      }
      fuseTimer.end('hydrateExpandedSections', start);
    },

    collapseAllSections: () => {
      const start = fuseTimer.start('collapseAllSections');

      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-expanded-sections', JSON.stringify([]));
      }

      set((state) => ({
        navigation: { ...state.navigation, expandedSections: [] },
        lastActionTiming: performance.now()
      }));

      fuseTimer.end('collapseAllSections', start);
    },

    expandAllSections: (sectionIds?: string[]) => {
      const start = fuseTimer.start('expandAllSections');

      const allSectionIds = sectionIds || get().navigation.expandedSections;

      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-expanded-sections', JSON.stringify(allSectionIds));
      }

      set((state) => ({
        navigation: { ...state.navigation, expandedSections: allSectionIds },
        lastActionTiming: performance.now()
      }));

      fuseTimer.end('expandAllSections', start);
    },

    // AI Sidebar methods
    setAISidebarState: (aiSidebarState) => {
      const start = fuseTimer.start('setAISidebarState');
      set({ aiSidebarState, lastActionTiming: performance.now() });
      fuseTimer.end('setAISidebarState', start);
    },

    // Phoenix modal methods
    setModalSkipped: (value: boolean) => {
      const start = fuseTimer.start('setModalSkipped');
      set({ modalSkipped: value, lastActionTiming: performance.now() });
      fuseTimer.end('setModalSkipped', start);
    },

    setModalReturning: (value: boolean) => {
      const start = fuseTimer.start('setModalReturning');
      set({ modalReturning: value, lastActionTiming: performance.now() });
      fuseTimer.end('setModalReturning', start);
    },

    setPhoenixButtonVisible: (value: boolean) => {
      const start = fuseTimer.start('setPhoenixButtonVisible');
      set({ phoenixButtonVisible: value, lastActionTiming: performance.now() });
      fuseTimer.end('setPhoenixButtonVisible', start);
    },

    setPhoenixNavigating: (value: boolean) => {
      const start = fuseTimer.start('setPhoenixNavigating');
      set({ phoenixNavigating: value, lastActionTiming: performance.now() });
      fuseTimer.end('setPhoenixNavigating', start);
    },

    // Shadow King - sovereign setup enforcement
    setShadowKingActive: (value: boolean) => {
      const start = fuseTimer.start('setShadowKingActive');
      set({ shadowKingActive: value, lastActionTiming: performance.now() });
      fuseTimer.end('setShadowKingActive', start);
    },

    // Red arrow - points to First Name field when modal already visible
    setShowRedArrow: (value: boolean) => {
      const start = fuseTimer.start('setShowRedArrow');
      set({ showRedArrow: value, lastActionTiming: performance.now() });
      fuseTimer.end('setShowRedArrow', start);
    },

    // Navigation timing - click-to-render measurement
    setNavClickTime: () => {
      set({ navClickTime: performance.now() });
    },
    clearNavClickTime: () => {
      set({ navClickTime: undefined });
    },

    // ════════════════════════════════════════════════════════════════════════
    // 🔱 SOVEREIGN ROUTER ACTIONS - FUSE 6.0
    // ════════════════════════════════════════════════════════════════════════

    navigate: (route: string) => {
      const start = fuseTimer.start('navigate');
      const current = get().sovereign.route;

      // Don't navigate to same route
      if (current === route) {
        fuseTimer.end('navigate (same route)', start);
        return;
      }

      const now = performance.now();

      set((state) => ({
        sovereign: {
          ...state.sovereign,
          route,
          history: [...state.sovereign.history.slice(-9), current],
          lastNavigatedAt: now,
        },
      }));

      // Update browser URL (cosmetic only - not functional)
      if (typeof window !== 'undefined') {
        const urlPath = route === 'dashboard' ? '/' : `/${route}`;
        window.history.pushState({ route }, '', urlPath);

        // If route has a hash, dispatch hashchange event for tab components
        if (route.includes('#')) {
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      }

      const duration = fuseTimer.end('navigate', start);

      // Performance gate
      if (duration > 65) {
        console.warn(`🔱 SR: Navigation exceeded 65ms target: ${duration.toFixed(1)}ms`);
      }

      console.log(`🔱 SR: ${current} → ${route} (${duration.toFixed(1)}ms)`);
    },

    goBack: () => {
      const start = fuseTimer.start('goBack');
      const { history } = get().sovereign;

      if (history.length === 0) {
        set((state) => ({
          sovereign: {
            ...state.sovereign,
            route: 'dashboard',
            lastNavigatedAt: performance.now(),
          },
        }));
        if (typeof window !== 'undefined') {
          window.history.pushState({ route: 'dashboard' }, '', '/');
        }
        fuseTimer.end('goBack (to dashboard)', start);
        return;
      }

      const previousRoute = history[history.length - 1];

      set((state) => ({
        sovereign: {
          ...state.sovereign,
          route: previousRoute,
          history: state.sovereign.history.slice(0, -1),
          lastNavigatedAt: performance.now(),
        },
      }));

      if (typeof window !== 'undefined') {
        window.history.back();
      }

      fuseTimer.end('goBack', start);
      console.log(`🔱 SR: ← Back to ${previousRoute}`);
    },

    sovereignToggleSection: (sectionId: string) => {
      const start = fuseTimer.start('sovereignToggleSection');

      set((state) => {
        const isExpanded = state.sovereign.expandedSections.includes(sectionId);
        const newSections = isExpanded
          ? state.sovereign.expandedSections.filter((id) => id !== sectionId)
          : [...state.sovereign.expandedSections, sectionId];

        if (typeof window !== 'undefined') {
          localStorage.setItem('fuse-sidebar-sections', JSON.stringify(newSections));
        }

        return {
          sovereign: {
            ...state.sovereign,
            expandedSections: newSections,
          },
        };
      });

      fuseTimer.end('sovereignToggleSection', start);
    },

    sovereignCollapseAll: () => {
      const start = fuseTimer.start('sovereignCollapseAll');

      set((state) => ({
        sovereign: {
          ...state.sovereign,
          expandedSections: [],
        },
      }));

      if (typeof window !== 'undefined') {
        localStorage.setItem('fuse-sidebar-sections', JSON.stringify([]));
      }

      fuseTimer.end('sovereignCollapseAll', start);
    },

    sovereignHydrateSections: () => {
      const start = fuseTimer.start('sovereignHydrateSections');

      if (typeof window === 'undefined') {
        fuseTimer.end('sovereignHydrateSections (SSR skip)', start);
        return;
      }

      const stored = localStorage.getItem('fuse-sidebar-sections');
      if (stored) {
        try {
          const sections = JSON.parse(stored);
          set((state) => ({
            sovereign: {
              ...state.sovereign,
              expandedSections: sections,
            },
          }));
        } catch {
          // Invalid JSON - ignore
        }
      }

      fuseTimer.end('sovereignHydrateSections', start);
    },

    sovereignToggleSidebar: () => {
      const start = fuseTimer.start('sovereignToggleSidebar');

      set((state) => ({
        sovereign: {
          ...state.sovereign,
          sidebarCollapsed: !state.sovereign.sidebarCollapsed,
        },
      }));

      fuseTimer.end('sovereignToggleSidebar', start);
    },
  };
});

// ══════════════════════════════════════════════════════════════════════════════
// 🔱 FOUC Prevention: Patch initial route on client immediately after store creation
// ══════════════════════════════════════════════════════════════════════════════
// This runs ONCE when the module is imported on the CLIENT.
// The inline script in layout.tsx has already saved the URL to localStorage.
// We read it here and patch the store BEFORE any component renders.

if (typeof window !== 'undefined') {
  const initialRoute = localStorage.getItem('fuse-initial-route');
  if (initialRoute && initialRoute !== 'dashboard') {
    // Patch the store synchronously before any React render
    useFuse.setState((state) => ({
      sovereign: {
        ...state.sovereign,
        route: initialRoute,
      },
    }));
    console.log(`🔱 FUSE: Initial route patched to "${initialRoute}" from localStorage`);
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Type Export for consumers
// ══════════════════════════════════════════════════════════════════════════════

export type { FuseStore };

// 🔱 Re-export Sovereign Router types for convenience
export type { DomainRoute, NavigationSlice } from './domains';
