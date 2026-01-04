// FUSE Store Brain - Type Definitions
// Following FUSE Doctrine: 2BA + Triple-T Ready
//
// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN SLICE TYPES - Imported from ./domains/ for single source of truth
// ══════════════════════════════════════════════════════════════════════════════

import type {
  ProductivitySlice,
  ProductivityData,
  ProductivityActions,
} from './domains/productivity';

import type {
  AdminSlice,
  AdminData,
  AdminActions,
} from './domains/admin';

import type {
  DashboardSlice,
  DashboardData,
  DashboardActions,
} from './domains/dashboard';

import type {
  FinanceSlice,
  FinanceData,
  FinanceActions,
} from './domains/finance';

import type {
  ClientsSlice,
  ClientsData,
  ClientsActions,
} from './domains/clients';

import type {
  ProjectsSlice,
  ProjectsData,
  ProjectsActions,
} from './domains/projects';

import type {
  SettingsSlice,
  SettingsData,
  SettingsActions,
} from './domains/settings';

import type {
  SystemSlice,
  SystemData,
  SystemActions,
} from './domains/system';

import type {
  ADPSource,
  ADPStatus,
  ADPCoordination,
} from './domains/_template';

import type { AvatarOption } from '@/fuse/constants/coreThemeConfig';

// Re-export all domain types for consumers
export type {
  ProductivitySlice,
  ProductivityData,
  ProductivityActions,
  AdminSlice,
  AdminData,
  AdminActions,
  DashboardSlice,
  DashboardData,
  DashboardActions,
  FinanceSlice,
  FinanceData,
  FinanceActions,
  ClientsSlice,
  ClientsData,
  ClientsActions,
  ProjectsSlice,
  ProjectsData,
  ProjectsActions,
  SettingsSlice,
  SettingsData,
  SettingsActions,
  SystemSlice,
  SystemData,
  SystemActions,
  ADPSource,
  ADPStatus,
  ADPCoordination,
};

// ══════════════════════════════════════════════════════════════════════════════
// CORE TYPES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * User document type - ready for 100K users
 *
 * 🛡️ SOVEREIGNTY DOCTRINE:
 * - `id` is ALWAYS Convex _id (canonical identity)
 * - `convexId` is explicit alias for clarity
 * - `clerkId` is auth reference ONLY - never use for Convex queries
 * - All domain operations use `id` (Convex _id), not `clerkId`
 */
export type FuseUser = {
  id: string;         // ✅ REQUIRED - Convex _id (canonical, sovereign identity)
  convexId: string;   // Explicit alias for absolute clarity
  clerkId: string;    // ⚠️ NON-CANONICAL: Auth handoff reference only
  email?: string | null;
  secondaryEmail?: string | null;
  emailVerified?: boolean;
  firstName: string; // REQUIRED - Clerk provides this
  lastName: string;  // REQUIRED - Clerk provides this
  rank?: 'admiral' | 'commodore' | 'captain' | 'crew' | null;
  setupStatus?: 'invited' | 'pending' | 'abandon' | 'complete' | 'revoked' | null;
  subscriptionStatus?: 'trial' | 'active' | 'expired' | 'lifetime' | 'cancelled' | null;
  createdAt?: number;
  lastLoginAt?: number; // Last login timestamp
  avatarUrl?: string | null;
  brandLogoUrl?: string | null; // Optional: Only set when user uploads custom logo
  // Business configuration
  entityName?: string | null;
  socialName?: string | null;
  businessCountry?: string | null;
  // Theme preferences - included in user object for zero-query theme loading
  themeName?: ThemeName;
  themeDark?: boolean;
  // Miror AI preferences
  mirorAvatarProfile?: AvatarOption;
  mirorEnchantmentEnabled?: boolean;
  mirorEnchantmentTiming?: 'subtle' | 'magical' | 'playful';
  // Email preferences
  emailMarkReadMode?: 'timer' | 'departure' | 'never';
  emailSoundTrash?: boolean;
  emailSoundSend?: boolean;
  emailSoundReceive?: boolean;
  emailSoundMark?: boolean;
  // Professional Genome fields
  phoneNumber?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  seniority?: string | null;
  industry?: string | null;
  companySize?: string | null;
  companyWebsite?: string | null;
  transformationGoal?: string | null;
  transformationStage?: string | null;
  transformationType?: string | null;
  timelineUrgency?: string | null;
  howDidYouHearAboutUs?: string | null;
  teamSize?: number | null;
  annualRevenue?: string | null;
  successMetric?: string | null;
} | null;

/**
 * Professional Genome - User's professional profile
 * Lives in settings_account_Genome table (separate from admin_users)
 */
export type GenomeData = {
  // Completion tracking
  completionPercent: number;
  // Professional Identity
  jobTitle?: string | null;
  department?: string | null;
  seniority?: string | null;
  // Company Context
  industry?: string | null;
  companySize?: string | null;
  companyWebsite?: string | null;
  // Transformation Journey
  transformationGoal?: string | null;
  transformationStage?: string | null;
  transformationType?: string | null;
  timelineUrgency?: string | null;
  // Growth Intel
  howDidYouHearAboutUs?: string | null;
  teamSize?: number | null;
  annualRevenue?: string | null;
  successMetric?: string | null;
} | null;

/**
 * Theme mode type following FUSE-STYLE system
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme name type from Convex schema
 */
export type ThemeName = 'transtheme';

/**
 * Navigation state - tracks current page context
 */
export type NavigationState = {
  currentRoute: string;
  breadcrumbs: string[];
  sidebarCollapsed: boolean;
  activeSection?: string;
  expandedSections: string[]; // Track which nav sections are expanded
  pendingRoute: string | null; // Track route being navigated to for INSTANT visual feedback
};

/**
 * AI Sidebar state - three states for instant interaction
 */
export type AISidebarState = 'closed' | 'open' | 'expand';

/**
 * User rank type - imported from rank system
 */
export type UserRank = 'crew' | 'captain' | 'commodore' | 'admiral';

/**
 * Core FUSE State - The behavioral brain
 * Handles all application state and performance tracking
 */
export type FuseState = {
  // User state
  user: FuseUser;
  rank: UserRank | undefined; // Quick access to rank (synced from user.rank)

  // Hydration state - tracks if store has been initialized from server
  isHydrated: boolean;

  // Theme state - FUSE-STYLE compliant
  themeMode: ThemeMode;
  themeName: ThemeName;

  // Navigation state - instant route tracking
  navigation: NavigationState;

  // AI Sidebar state - instant interaction
  aiSidebarState: AISidebarState;

  // Phoenix modal state - flying button and setup modal tracking
  modalSkipped: boolean;
  phoenixButtonVisible: boolean;
  phoenixNavigating: boolean;

  // Shadow King - sovereign setup modal enforcement
  shadowKingActive: boolean;
  showRedArrow: boolean;

  // Performance tracking
  lastActionTiming?: number;
  navClickTime?: number; // Timestamp when sidebar nav click occurs (for click-to-render timing)

  // Domain slices - Great Provider Ecosystem
  finance: FinanceSlice;
  clients: ClientsSlice;
  productivity: ProductivitySlice;
  projects: ProjectsSlice;
  settings: SettingsSlice;
  admin: AdminSlice;
  dashboard: DashboardSlice;
  system: SystemSlice;

  // NOTE: Domain hydration is tracked via domain.status === 'hydrated'
  // No separate isXHydrated booleans needed - ONE source of truth (PRISM pattern)

  // Core methods - instant, tracked operations
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

  // Theme methods - instant theme switching with DB sync
  hydrateThemeMode: (mode: ThemeMode) => void; // For hydration (no DB sync)
  hydrateThemeName: (name: ThemeName) => void; // For hydration (no DB sync)
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setThemeName: (name: ThemeName) => Promise<void>;
  toggleThemeMode: () => Promise<void>;
  // 🛡️ SID-5.3: Use sovereign userId (Convex _id)
  syncThemeFromDB: (userId: string) => Promise<void>;

  // Navigation methods - instant route updates
  setCurrentRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: string[]) => void;
  setPendingRoute: (route: string | null) => void;
  toggleSidebar: () => void;
  setActiveSection: (section?: string) => void;
  toggleSection: (sectionId: string) => void; // Toggle nav section expand/collapse
  hydrateExpandedSections: () => void; // Restore expanded sections from localStorage
  collapseAllSections: () => void; // Collapse all nav sections
  expandAllSections: () => void; // Expand all nav sections

  // AI Sidebar methods - instant state changes
  setAISidebarState: (state: AISidebarState) => void;

  // Phoenix modal methods - instant state changes
  setModalSkipped: (value: boolean) => void;
  setPhoenixButtonVisible: (value: boolean) => void;
  setPhoenixNavigating: (value: boolean) => void;

  // Shadow King methods - sovereign setup enforcement
  setShadowKingActive: (value: boolean) => void;
  setShowRedArrow: (value: boolean) => void;

  // Navigation timing - click-to-render measurement
  setNavClickTime: () => void; // Sets timestamp when nav link clicked
  clearNavClickTime: () => void; // Clears after timing is logged

  // Domain hydration methods - Great Provider Ecosystem
  // Uses *Data types (not *Slice) - ADP coordination fields are set internally
  hydrateFinance: (data: Partial<FinanceData>, source?: ADPSource) => void;
  hydrateClients: (data: Partial<ClientsData>, source?: ADPSource) => void;
  hydrateProductivity: (data: Partial<ProductivityData>, source?: ADPSource) => void;
  hydrateProjects: (data: Partial<ProjectsData>, source?: ADPSource) => void;
  hydrateSettings: (data: Partial<SettingsData>, source?: ADPSource) => void;
  hydrateAdmin: (data: Partial<AdminData>, source?: ADPSource) => void;
  hydrateDashboard: (data: Partial<DashboardData>, source?: ADPSource) => void;
  hydrateSystem: (data: Partial<SystemData>, source?: ADPSource) => void;

  // Domain clear methods
  clearFinance: () => void;
  clearClients: () => void;
  clearProductivity: () => void;
  clearProjects: () => void;
  clearSettings: () => void;
  clearAdmin: () => void;
  clearDashboard: () => void;
  clearSystem: () => void;
};

/**
 * FUSE Timer interface - millisecond precision tracking
 * NOTE: Implementation lives in ./domains/_template.ts
 */
export interface FuseTimer {
  start: (action: string) => number;
  end: (action: string, startTime: number) => number;
}

// ══════════════════════════════════════════════════════════════════════
// DOMAIN SLICES - Single Source of Truth
// ══════════════════════════════════════════════════════════════════════
//
// All domain slice types are now defined in ./domains/*.ts
// and re-exported at the top of this file.
//
// THE STANDARD:
//   - Domain slices live in src/store/domains/
//   - Each domain has: status, lastFetchedAt, source (ADP Coordination)
//   - status === 'hydrated' means data is ready (NO separate isXHydrated booleans)
//   - ONE source of truth
//
// Reference: 04-ADP-PATTERN.md, 15-TTT-SUPPLEMENT.md
// ══════════════════════════════════════════════════════════════════════
