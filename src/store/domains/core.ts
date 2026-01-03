/**
 * ══════════════════════════════════════════════════════════════════════════════
 * CORE SLICE - User, Genome, Theme, UI State
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * This slice owns the foundational application state:
 * - User identity and profile
 * - Professional Genome
 * - Theme preferences
 * - UI state (modals, sidebar, Phoenix)
 *
 * THE STANDARD:
 * - All core state and actions in one slice
 * - fuse.ts composes this, never reimplements
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { fuseTimer } from './_template';
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

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CoreSlice {
  user: FuseUser;
  genome: GenomeData;
  rank: UserRank | undefined;
  isHydrated: boolean;
  themeMode: ThemeMode;
  themeName: ThemeName;
  navigation: NavigationState;
  aiSidebarState: AISidebarState;
  modalSkipped: boolean;
  modalReturning: boolean;
  phoenixButtonVisible: boolean;
  phoenixNavigating: boolean;
  shadowKingActive: boolean;
  showRedArrow: boolean;
  lastActionTiming?: number;
  navClickTime?: number;
}

export interface CoreActions {
  setUser: (user: FuseUser | null) => void;
  clearUser: () => void;
  updateUser: (updates: Partial<NonNullable<FuseUser>>) => void;
  updateUserLocal: (updates: Partial<NonNullable<FuseUser>>) => Promise<void>;
  updateMirorLocal: (updates: {
    mirorAvatarProfile?: AvatarOption;
    mirorEnchantmentEnabled?: boolean;
    mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
  }) => Promise<void>;
  hydrateGenome: (data: GenomeData) => void;
  updateGenomeLocal: (updates: Partial<NonNullable<GenomeData>>) => Promise<void>;
  hydrateThemeMode: (mode: ThemeMode) => void;
  hydrateThemeName: (name: ThemeName) => void;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeName: (name: ThemeName) => Promise<void>;
  toggleThemeMode: () => void;
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
  setNavClickTime: () => void;
  clearNavClickTime: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

export const initialCoreState: CoreSlice = {
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createCoreSlice: StateCreator<
  CoreSlice & CoreActions,
  [],
  [],
  CoreSlice & CoreActions
> = (set, get) => ({
  ...initialCoreState,

  setUser: (user) => {
    const start = fuseTimer.start('setUser');
    if (process.env.NODE_ENV === 'development' && user?.id?.startsWith('user_')) {
      console.error('⛔ SOVEREIGNTY VIOLATION: user.id appears to be Clerk ID, not Convex _id');
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

  updateUser: (updates) => {
    const start = fuseTimer.start('updateUser');
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      const rank = updatedUser?.rank as UserRank | undefined;
      return { user: updatedUser, rank, lastActionTiming: performance.now() };
    });
    fuseTimer.end('updateUser', start);
  },

  updateUserLocal: async (updates) => {
    const start = fuseTimer.start('updateUserLocal');
    set((state) => {
      const updatedUser = state.user ? { ...state.user, ...updates } : null;
      const rank = updatedUser?.rank as UserRank | undefined;
      return { user: updatedUser, rank, lastActionTiming: performance.now() };
    });

    const profileUpdates: Record<string, string | undefined> = {};
    const fields = ['firstName', 'lastName', 'entityName', 'socialName', 'phoneNumber', 'businessCountry'] as const;
    for (const field of fields) {
      if (field in updates && updates[field] !== null) {
        profileUpdates[field] = updates[field] ?? undefined;
      }
    }

    if (Object.keys(profileUpdates).length > 0) {
      const { updateProfileAction } = await import('@/app/actions/user-mutations');
      const result = await updateProfileAction(profileUpdates);
      if (!result.success) throw new Error(result.error || 'Failed to save');
    }
    fuseTimer.end('updateUserLocal', start);
  },

  updateMirorLocal: async (updates) => {
    const start = fuseTimer.start('updateMirorLocal');
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
      lastActionTiming: performance.now(),
    }));
    const { updateMirorAction } = await import('@/app/actions/user-mutations');
    const result = await updateMirorAction(updates);
    if (!result.success) throw new Error(result.error || 'Failed to save Miror settings');
    fuseTimer.end('updateMirorLocal', start);
  },

  hydrateGenome: (data) => {
    const start = fuseTimer.start('hydrateGenome');
    set({ genome: data, lastActionTiming: performance.now() });
    fuseTimer.end('hydrateGenome', start);
  },

  updateGenomeLocal: async (updates) => {
    const start = fuseTimer.start('updateGenomeLocal');
    set((state) => {
      const currentGenome = state.genome || { completionPercent: 0 };
      const newGenome = { ...currentGenome, ...updates };
      const fields = ['jobTitle', 'department', 'seniority', 'industry', 'companySize', 'companyWebsite',
        'transformationGoal', 'transformationStage', 'transformationType', 'timelineUrgency',
        'howDidYouHearAboutUs', 'teamSize', 'annualRevenue', 'successMetric'] as const;
      let filled = 0;
      for (const field of fields) {
        if (newGenome[field] !== undefined && newGenome[field] !== null && newGenome[field] !== '') filled++;
      }
      return { genome: { ...newGenome, completionPercent: Math.round((filled / fields.length) * 100) }, lastActionTiming: performance.now() };
    });

    const actionUpdates: Record<string, string | number | undefined> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'completionPercent' && value !== null) actionUpdates[key] = value as string | number | undefined;
    }
    const { updateGenomeAction } = await import('@/app/actions/user-mutations');
    const result = await updateGenomeAction(actionUpdates);
    if (!result.success) throw new Error(result.error || 'Failed to save genome');
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

  hydrateThemeName: (name) => {
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
    if (user?.id) {
      try {
        await convex.mutation(api.domains.admin.users.api.updateThemePreferences, {
          userId: user.id as import('@/convex/_generated/dataModel').Id<"admin_users">,
          themeDark: mode === 'dark'
        });
      } catch (error) { console.error('Failed to sync theme to database:', error); }
    }
    fuseTimer.end('setThemeMode', start);
  },

  setThemeName: async (name) => {
    const start = fuseTimer.start('setThemeName');
    set({ themeName: name, lastActionTiming: performance.now() });
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, name);
      localStorage.setItem(STORAGE_KEYS.THEME_NAME, name);
    }
    const { user, themeMode } = get();
    if (user?.id) {
      try {
        await convex.mutation(api.domains.admin.users.api.updateThemePreferences, {
          userId: user.id as import('@/convex/_generated/dataModel').Id<"admin_users">,
          themeName: name,
          themeDark: themeMode === 'dark'
        });
      } catch (error) { console.error('Failed to sync theme name to database:', error); }
    }
    fuseTimer.end('setThemeName', start);
  },

  syncThemeFromDB: async (userId) => {
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
        if (savedMode) set({ themeMode: savedMode, themeName: 'transtheme', lastActionTiming: performance.now() });
      }
    }
    fuseTimer.end('syncThemeFromDB', start);
  },

  toggleThemeMode: () => {
    const start = fuseTimer.start('toggleThemeMode');
    const newMode = get().themeMode === 'light' ? 'dark' : 'light';
    set({ themeMode: newMode, lastActionTiming: performance.now() });
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_MODE, newMode);
      document.documentElement.setAttribute(DOM_ATTRIBUTES.THEME_NAME, 'transtheme');
      localStorage.setItem(STORAGE_KEYS.THEME_MODE, newMode);
    }
    const { user } = get();
    if (user?.clerkId) {
      import('@/app/actions/user-mutations').then(({ updateThemeAction }) => {
        updateThemeAction(newMode === 'dark').catch((e) => console.error('Failed to sync theme:', e));
      });
    }
    fuseTimer.end('toggleThemeMode', start);
  },

  // Navigation actions (simple setters - no timing needed)
  setCurrentRoute: (route) => set((s) => ({ navigation: { ...s.navigation, currentRoute: route } })),
  setBreadcrumbs: (breadcrumbs) => set((s) => ({ navigation: { ...s.navigation, breadcrumbs } })),
  setPendingRoute: (route) => set((s) => ({ navigation: { ...s.navigation, pendingRoute: route } })),
  toggleSidebar: () => set((s) => ({ navigation: { ...s.navigation, sidebarCollapsed: !s.navigation.sidebarCollapsed } })),
  setActiveSection: (section) => set((s) => ({ navigation: { ...s.navigation, activeSection: section } })),

  toggleSection: (sectionId) => set((state) => {
    const isExpanded = state.navigation.expandedSections.includes(sectionId);
    const newSections = isExpanded ? state.navigation.expandedSections.filter(id => id !== sectionId) : [...state.navigation.expandedSections, sectionId];
    if (typeof window !== 'undefined') localStorage.setItem('sidebar-expanded-sections', JSON.stringify(newSections));
    return { navigation: { ...state.navigation, expandedSections: newSections } };
  }),

  hydrateExpandedSections: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-expanded-sections');
      if (stored) { try { set((s) => ({ navigation: { ...s.navigation, expandedSections: JSON.parse(stored) } })); } catch { /* ignore */ } }
    }
  },

  collapseAllSections: () => {
    if (typeof window !== 'undefined') localStorage.setItem('sidebar-expanded-sections', JSON.stringify([]));
    set((s) => ({ navigation: { ...s.navigation, expandedSections: [] } }));
  },

  expandAllSections: (sectionIds) => {
    const allIds = sectionIds || get().navigation.expandedSections;
    if (typeof window !== 'undefined') localStorage.setItem('sidebar-expanded-sections', JSON.stringify(allIds));
    set((s) => ({ navigation: { ...s.navigation, expandedSections: allIds } }));
  },

  // Simple UI state setters (no timing needed)
  setAISidebarState: (aiSidebarState) => set({ aiSidebarState }),
  setModalSkipped: (value) => set({ modalSkipped: value }),
  setModalReturning: (value) => set({ modalReturning: value }),
  setPhoenixButtonVisible: (value) => set({ phoenixButtonVisible: value }),
  setPhoenixNavigating: (value) => set({ phoenixNavigating: value }),
  setShadowKingActive: (value) => set({ shadowKingActive: value }),
  setShowRedArrow: (value) => set({ showRedArrow: value }),
  setNavClickTime: () => set({ navClickTime: performance.now() }),
  clearNavClickTime: () => set({ navClickTime: undefined }),
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type CoreStore = CoreSlice & CoreActions;
