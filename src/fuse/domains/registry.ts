/**──────────────────────────────────────────────────────────────────────┐
│  🚀 FUSE STACK - DOMAIN REGISTRY                                       │
│  /src/fuse/domains/registry.ts                                         │
│                                                                        │
│  Central registry of all active domains in the application             │
│  Single source of truth for domain configuration                       │
│  Following FUSE Stack WARP/WRAP pattern                                │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * FUSE Stack Domain Registry
 *
 * All active domains following WARP + WRAP pattern:
 * - WARP: Server-side preload in layout.tsx
 * - WRAP: Client-side hook (use[Domain]Data)
 * - Provider: Domain provider with initialData
 * - Store: Zustand slice in FUSE store
 *
 * Architecture Pattern:
 * 1. Server fetches data (WARP)
 * 2. Provider hydrates store with initialData
 * 3. Components use WRAP hook { data, computed, actions, flags }
 * 4. Zero waterfalls, instant render
 */

export const DOMAINS = {
  productivity: {
    name: 'Productivity',
    description: 'Email, calendar, tasks, bookings, pipeline management',
    path: '/productivity',
    altPaths: ['/work'],
    hook: 'useProductivityData',
    provider: 'ProductivityProvider',
    storeSlice: 'productivity',
    ranks: ['captain', 'commodore'] as const,
    category: 'business' as const,
    features: [
      'Email management',
      'Calendar events',
      'Task tracking',
      'Booking system',
      'Pipeline management',
    ],
  },

  financial: {
    name: 'Financial',
    description: 'Invoices, accounts, transactions, bills, payroll',
    path: '/finance',
    altPaths: ['/financial', '/accounting'],
    hook: 'useFinancialData',
    provider: 'FinancesProvider',
    storeSlice: 'finance',
    ranks: ['captain', 'commodore'] as const,
    category: 'business' as const,
    features: [
      'Invoice management',
      'Account tracking',
      'Transaction history',
      'Bill payments',
      'Payroll runs',
      'Financial reports',
    ],
  },

  clients: {
    name: 'Clients',
    description: 'Client relationships, teams, sessions, reports',
    path: '/client',
    altPaths: ['/clients', '/customers'],
    hook: 'useClientData',
    provider: 'ClientsProvider',
    storeSlice: 'clients',
    ranks: ['captain', 'commodore'] as const,
    category: 'business' as const,
    features: [
      'Client profiles',
      'Team management',
      'Session tracking',
      'Client reports',
      'Relationship history',
    ],
  },

  project: {
    name: 'Project',
    description: 'Project tracking and management',
    path: '/project',
    altPaths: ['/projects'],
    hook: 'useProjectData',
    provider: 'ProjectsProvider',
    storeSlice: 'project',
    ranks: ['captain', 'commodore'] as const,
    category: 'business' as const,
    features: [
      'Project overview',
      'Milestone tracking',
      'Team coordination',
      'Progress monitoring',
      'Resource allocation',
    ],
  },

  settings: {
    name: 'Settings',
    description: 'User settings, preferences, notifications',
    path: '/setting',
    altPaths: ['/settings', '/account'],
    hook: 'useSettingsData',
    provider: 'SettingsProvider',
    storeSlice: 'settings',
    ranks: ['admiral', 'captain', 'commodore', 'crew'] as const,
    category: 'settings' as const,
    features: [
      'Profile settings',
      'Theme preferences',
      'Security settings',
      'Notification management',
      'Account preferences',
    ],
  },

  admin: {
    name: 'Admin',
    description: 'User management, deletion logs, platform administration',
    path: '/domain/admin',
    altPaths: ['/admin'],
    hook: 'useAdminData',
    provider: 'AdminProvider',
    storeSlice: 'admin',
    ranks: ['admiral'] as const,
    category: 'admin' as const,
    features: [
      'User management',
      'Deletion logs (VANISH journal)',
      'Platform-wide administration',
      'Admiral-only access',
    ],
  },
} as const;

export type DomainKey = keyof typeof DOMAINS;
export type DomainConfig = typeof DOMAINS[DomainKey];

/**
 * Get domain configuration by key
 *
 * @param key - Domain key (work, financial, clients, project, settings)
 * @returns Domain configuration object
 */
export function getDomain(key: DomainKey): DomainConfig {
  return DOMAINS[key];
}

/**
 * Get all domain keys
 *
 * @returns Array of domain keys
 */
export function getAllDomainKeys(): DomainKey[] {
  return Object.keys(DOMAINS) as DomainKey[];
}

/**
 * Get all domain configurations
 *
 * @returns Array of domain config objects
 */
export function getAllDomains(): DomainConfig[] {
  return Object.values(DOMAINS);
}

/**
 * Check if a route belongs to a domain
 *
 * @param route - Current route path (e.g., '/work', '/finance')
 * @returns Domain key if found, null otherwise
 */
export function getDomainForRoute(route: string): DomainKey | null {
  for (const [key, config] of Object.entries(DOMAINS)) {
    // Check main path
    if (route.startsWith(config.path)) {
      return key as DomainKey;
    }

    // Check alternate paths
    if (config.altPaths?.some(altPath => route.startsWith(altPath))) {
      return key as DomainKey;
    }
  }

  return null;
}

/**
 * Get hook name for a domain
 *
 * @param key - Domain key
 * @returns Hook name (e.g., 'useWorkData')
 */
export function getDomainHook(key: DomainKey): string {
  return DOMAINS[key].hook;
}

/**
 * Get provider name for a domain
 *
 * @param key - Domain key
 * @returns Provider name (e.g., 'WorkProvider')
 */
export function getDomainProvider(key: DomainKey): string {
  return DOMAINS[key].provider;
}

/**
 * Get store slice name for a domain
 *
 * @param key - Domain key
 * @returns Store slice name (e.g., 'work')
 */
export function getDomainStoreSlice(key: DomainKey): string {
  return DOMAINS[key].storeSlice;
}

/**
 * Get all domains accessible by a specific rank
 *
 * @param rank - User rank (admiral, captain, commodore, crew)
 * @returns Array of domains this rank can access
 */
export function getDomainsForRank(rank: 'admiral' | 'captain' | 'commodore' | 'crew') {
  return Object.entries(DOMAINS)
    .filter(([, config]) => (config.ranks as readonly string[]).includes(rank))
    .map(([key, config]) => ({ key: key as DomainKey, ...config }));
}

/**
 * Get all domains by category
 *
 * @param category - Domain category (business, admin, system, settings)
 * @returns Array of domains in this category
 */
export function getDomainsByCategory(category: 'business' | 'admin' | 'system' | 'settings') {
  return Object.entries(DOMAINS)
    .filter(([, config]) => config.category === category)
    .map(([key, config]) => ({ key: key as DomainKey, ...config }));
}

/**
 * Check if a rank has access to a domain
 *
 * @param rank - User rank
 * @param domainKey - Domain to check
 * @returns True if rank has access
 */
export function rankHasAccess(
  rank: 'admiral' | 'captain' | 'commodore' | 'crew',
  domainKey: DomainKey
): boolean {
  return (DOMAINS[domainKey].ranks as readonly string[]).includes(rank);
}
