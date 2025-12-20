/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMAIN SLICES - BARREL EXPORT
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * THE STANDARD: Every domain has its own slice file.
 * This is how enterprise SaaS scales to 100K users.
 *
 * Structure:
 *   src/store/domains/
 *   ├── _template.ts      # ADP coordination template (reference)
 *   ├── index.ts          # This file (barrel export)
 *   ├── productivity.ts   # Productivity domain
 *   ├── admin.ts          # Admin domain (Admiral only)
 *   ├── dashboard.ts      # Dashboard (UI preferences only)
 *   ├── finance.ts        # Finance domain
 *   ├── clients.ts        # Clients domain
 *   ├── projects.ts       # Projects domain
 *   ├── settings.ts       # Settings domain (SELF-scoped)
 *   └── system.ts         # System domain (Admiral only)
 *
 * All slices follow ADP pattern with:
 *   - status: 'idle' | 'loading' | 'ready' | 'error'
 *   - lastFetchedAt: number | undefined
 *   - source: 'SSR' | 'WARP' | 'CONVEX_LIVE' | 'MUTATION' | 'ROLLBACK'
 *   - hydrate[Domain]() function
 *   - clear[Domain]() function
 *
 * References:
 *   - 04-ADP-PATTERN.md
 *   - 15-TTT-SUPPLEMENT.md
 * ══════════════════════════════════════════════════════════════════════════════
 */

// Template exports (for reference/typing)
export type { ADPSource, ADPStatus, ADPCoordination } from './_template';
export { fuseTimer } from './_template';

// Domain slice exports
export {
  createProductivitySlice,
  type ProductivitySlice,
  type ProductivityActions,
  type ProductivityData,
  type ProductivityStore,
} from './productivity';

export {
  createAdminSlice,
  type AdminSlice,
  type AdminActions,
  type AdminData,
  type AdminStore,
} from './admin';

export {
  createDashboardSlice,
  type DashboardSlice,
  type DashboardActions,
  type DashboardData,
  type DashboardStore,
} from './dashboard';

export {
  createFinanceSlice,
  type FinanceSlice,
  type FinanceActions,
  type FinanceData,
  type FinanceStore,
} from './finance';

export {
  createClientsSlice,
  type ClientsSlice,
  type ClientsActions,
  type ClientsData,
  type ClientsStore,
} from './clients';

export {
  createProjectsSlice,
  type ProjectsSlice,
  type ProjectsActions,
  type ProjectsData,
  type ProjectsStore,
} from './projects';

export {
  createSettingsSlice,
  type SettingsSlice,
  type SettingsActions,
  type SettingsData,
  type SettingsStore,
} from './settings';

export {
  createSystemSlice,
  type SystemSlice,
  type SystemActions,
  type SystemData,
  type SystemStore,
} from './system';

// 🔱 SOVEREIGN ROUTER - Navigation domain
export {
  createNavigationActions,
  initialNavigationState,
  getDomainFromRoute,
  getPageFromRoute,
  isRouteInDomain,
  urlPathToRoute,
  type NavigationSlice,
  type NavigationActions,
  type NavigationData,
  type DomainRoute,
} from './navigation';
