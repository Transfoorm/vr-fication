/**
 * ══════════════════════════════════════════════════════════════════════════════
 * 🔱 SOVEREIGN ROUTER - Navigation Slice
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * FUSE 6.0: Navigation is domain state. Domain state belongs to FUSE.
 * No App Router. No Jotai. One store. One truth.
 *
 * This slice governs ALL domain navigation after the shell handover.
 * App Router loads the shell ONCE, then Sovereign Router takes command.
 *
 * THE STANDARD:
 *   - route: Current DomainRoute (the sovereign state)
 *   - history: Navigation stack for goBack()
 *   - navigate(): The ONLY way to change routes
 *   - Zero server round-trips
 *   - 32-65ms navigation target
 *
 * References:
 *   - TTT-SRB-(SOVEREIGN-ROUTER-BLUEPRINT).md
 *   - TTT-SRB-IMPLEMENTATION-KIT.md
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { fuseTimer } from './_template';

// ─────────────────────────────────────────────────────────────────────────────
// Domain Routes - The Sovereign Territory
// ─────────────────────────────────────────────────────────────────────────────

/** All navigable routes within the sovereign domain */
export type DomainRoute =
  // Dashboard (home)
  | 'dashboard'
  // Productivity
  | 'productivity/calendar'
  | 'productivity/bookings'
  | 'productivity/tasks'
  | 'productivity/email'
  | 'productivity/meetings'
  // Admin
  | 'admin/users'
  | 'admin/plans'
  | 'admin/showcase'
  // Clients
  | 'clients/contacts'
  | 'clients/teams'
  | 'clients/sessions'
  | 'clients/pipeline'
  | 'clients/reports'
  // Finance
  | 'finance/overview'
  | 'finance/transactions'
  | 'finance/invoices'
  | 'finance/payments'
  | 'finance/reports'
  // Projects
  | 'projects/charts'
  | 'projects/locations'
  | 'projects/tracking'
  // System
  | 'system/ai'
  | 'system/ranks'
  | 'system/database'
  // Settings
  | 'settings/account'
  | 'settings/preferences'
  | 'settings/security'
  | 'settings/billing'
  | 'settings/plan';

// ─────────────────────────────────────────────────────────────────────────────
// Slice Types
// ─────────────────────────────────────────────────────────────────────────────

/** Navigation data - sovereign routing state */
export interface NavigationData {
  /** Current active route (internal format without leading /) */
  route: string;
  /** Navigation history stack (for goBack) */
  history: string[];
  /** Timestamp of last navigation (for timing) */
  lastNavigatedAt: number;
  /** Sidebar expanded sections (preserved) */
  expandedSections: string[];
  /** Sidebar collapsed state */
  sidebarCollapsed: boolean;
}

/** Full navigation slice - extends NavigationData (no ADP needed - always ready) */
export type NavigationSlice = NavigationData;

/** Navigation actions - sovereign routing control */
export interface NavigationActions {
  /**
   * Navigate to a route - THE SOVEREIGN COMMAND
   * This is the ONLY way to change routes in FUSE 6.0
   * Zero server. Zero middleware. Instant.
   * @param route - Internal format without leading / (e.g., 'admin/users')
   */
  navigate: (route: string) => void;

  /**
   * Go back to previous route
   * Uses history stack, falls back to dashboard
   */
  goBack: () => void;

  /**
   * Toggle sidebar section expand/collapse
   * Persists to localStorage
   */
  toggleSection: (sectionId: string) => void;

  /**
   * Collapse all sidebar sections
   */
  collapseAllSections: () => void;

  /**
   * Hydrate expanded sections from localStorage
   * Called on FuseApp mount
   */
  hydrateExpandedSections: () => void;

  /**
   * Toggle sidebar collapsed state
   */
  toggleSidebar: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Known Routes (for validation)
// ─────────────────────────────────────────────────────────────────────────────

const KNOWN_ROUTES: DomainRoute[] = [
  'dashboard',
  'productivity/calendar', 'productivity/bookings', 'productivity/tasks', 'productivity/email', 'productivity/meetings',
  'admin/users', 'admin/plans', 'admin/showcase',
  'clients/contacts', 'clients/teams', 'clients/sessions', 'clients/pipeline', 'clients/reports',
  'finance/overview', 'finance/transactions', 'finance/invoices', 'finance/payments', 'finance/reports',
  'projects/charts', 'projects/locations', 'projects/tracking',
  'system/ai', 'system/ranks', 'system/database',
  'settings/account', 'settings/preferences', 'settings/security', 'settings/billing', 'settings/plan',
];

// ─────────────────────────────────────────────────────────────────────────────
// URL → Route Conversion (must be defined before initial state)
// ─────────────────────────────────────────────────────────────────────────────

/** Convert URL path to DomainRoute (for initial load) */
export function urlPathToRoute(path: string): DomainRoute {
  // Remove leading slash: '/admin/users' → 'admin/users'
  const cleaned = path.replace(/^\//, '');

  // Root path is dashboard
  if (!cleaned || cleaned === '') return 'dashboard';

  // Validate it's a known route
  if (KNOWN_ROUTES.includes(cleaned as DomainRoute)) {
    return cleaned as DomainRoute;
  }

  // Unknown route - default to dashboard
  console.warn(`🔱 SR: Unknown route "${cleaned}", defaulting to dashboard`);
  return 'dashboard';
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

// Note: The actual initial route is set in fuse.ts using localStorage
// which is populated by an inline script in layout.tsx before React hydrates.
// This ensures zero FOUC - the store has the correct route from the start.

export const initialNavigationState: NavigationSlice = {
  route: 'dashboard', // Default for SSR, overridden on client via localStorage
  history: [],
  lastNavigatedAt: 0,
  expandedSections: [],
  sidebarCollapsed: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

type SetState = (
  partial: Partial<NavigationSlice> | ((state: NavigationSlice) => Partial<NavigationSlice>)
) => void;
type GetState = () => NavigationSlice;

export const createNavigationActions = (
  set: SetState,
  get: GetState
): NavigationActions => ({
  navigate: (route: string) => {
    const start = fuseTimer.start('navigate');
    const current = get().route;

    // Don't navigate to same route
    if (current === route) {
      fuseTimer.end('navigate (same route)', start);
      return;
    }

    const now = performance.now();

    set((state) => ({
      route,
      history: [...state.history.slice(-9), current], // Keep last 10
      lastNavigatedAt: now,
    }));

    // Update browser URL (cosmetic only - not functional)
    // This keeps the URL bar in sync but navigation is FUSE-controlled
    if (typeof window !== 'undefined') {
      const urlPath = route === 'dashboard' ? '/' : `/${route}`;
      window.history.pushState({ route }, '', urlPath);
    }

    const duration = fuseTimer.end('navigate', start);

    // Performance gate - warn if navigation exceeds target
    if (duration > 65) {
      console.warn(`🔱 SR: Navigation exceeded 65ms target: ${duration.toFixed(1)}ms`);
    }

    console.log(`🔱 SR: ${current} → ${route} (${duration.toFixed(1)}ms)`);
  },

  goBack: () => {
    const start = fuseTimer.start('goBack');
    const { history } = get();

    if (history.length === 0) {
      // No history - go to dashboard
      set({ route: 'dashboard', lastNavigatedAt: performance.now() });
      if (typeof window !== 'undefined') {
        window.history.pushState({ route: 'dashboard' }, '', '/');
      }
      fuseTimer.end('goBack (to dashboard)', start);
      return;
    }

    const previousRoute = history[history.length - 1];

    set((state) => ({
      route: previousRoute,
      history: state.history.slice(0, -1),
      lastNavigatedAt: performance.now(),
    }));

    if (typeof window !== 'undefined') {
      window.history.back();
    }

    fuseTimer.end('goBack', start);
    console.log(`🔱 SR: ← Back to ${previousRoute}`);
  },

  toggleSection: (sectionId: string) => {
    const start = fuseTimer.start('toggleSection');

    set((state) => {
      const isExpanded = state.expandedSections.includes(sectionId);
      const newSections = isExpanded
        ? state.expandedSections.filter((id) => id !== sectionId)
        : [...state.expandedSections, sectionId];

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('fuse-sidebar-sections', JSON.stringify(newSections));
      }

      return { expandedSections: newSections };
    });

    fuseTimer.end('toggleSection', start);
  },

  collapseAllSections: () => {
    const start = fuseTimer.start('collapseAllSections');

    set({ expandedSections: [] });

    if (typeof window !== 'undefined') {
      localStorage.setItem('fuse-sidebar-sections', JSON.stringify([]));
    }

    fuseTimer.end('collapseAllSections', start);
  },

  hydrateExpandedSections: () => {
    const start = fuseTimer.start('hydrateExpandedSections');

    if (typeof window === 'undefined') {
      fuseTimer.end('hydrateExpandedSections (SSR skip)', start);
      return;
    }

    const stored = localStorage.getItem('fuse-sidebar-sections');
    if (stored) {
      try {
        const sections = JSON.parse(stored);
        set({ expandedSections: sections });
      } catch {
        // Invalid JSON - ignore
      }
    }

    fuseTimer.end('hydrateExpandedSections', start);
  },

  toggleSidebar: () => {
    const start = fuseTimer.start('toggleSidebar');

    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));

    fuseTimer.end('toggleSidebar', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Route Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get the domain from a route (e.g., 'finance/invoices' → 'finance') */
export function getDomainFromRoute(route: DomainRoute): string {
  if (route === 'dashboard') return 'dashboard';
  return route.split('/')[0];
}

/** Get the page from a route (e.g., 'finance/invoices' → 'invoices') */
export function getPageFromRoute(route: DomainRoute): string {
  if (route === 'dashboard') return 'dashboard';
  const parts = route.split('/');
  return parts[1] || parts[0];
}

/** Check if a route belongs to a domain */
export function isRouteInDomain(route: DomainRoute, domain: string): boolean {
  if (domain === 'dashboard') return route === 'dashboard';
  return route.startsWith(`${domain}/`);
}
