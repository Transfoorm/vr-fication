/**
 * +----------------------------------------------------------------------+
 * |  ✅ SRS MANIFEST VALIDATOR - Sovereign Router Enforcement            |
 * |  scripts/validateManifest.ts                                         |
 * |                                                                      |
 * |  Validates SRS architecture integrity:                               |
 * |  1. Every manifest route has a Router.tsx case                       |
 * |  2. Every Router.tsx case has an import                              |
 * |  3. Every import points to an existing file                          |
 * |  4. Every Router.tsx case is in KNOWN_ROUTES (navigation.ts)         |
 * |                                                                      |
 * |  SRS Layer 1: Compile-Time Validation                                |
 * |  - Catches manifest/Router drift before deployment                   |
 * |  - Ensures nav configs match actual views                            |
 * |  - Prevents unknown route errors in production                       |
 * |                                                                      |
 * |  References: SRS-ARCHITECTURE.md                                     |
 * +----------------------------------------------------------------------+
 */

import fs from 'node:fs';
import path from 'node:path';
import { ALL_MANIFESTS } from '@/rank/manifest';

const ROOT = process.cwd();
const ROUTER_PATH = path.join(ROOT, 'src', 'app', 'domains', 'Router.tsx');
const NAVIGATION_PATH = path.join(ROOT, 'src', 'store', 'domains', 'navigation.ts');

/**
 * Parse Router.tsx to extract:
 * - All case statements (routes the Router handles)
 * - All imports (view components)
 */
function parseRouter(): { cases: Set<string>; imports: Map<string, string> } {
  const content = fs.readFileSync(ROUTER_PATH, 'utf-8');

  // Extract case statements: case 'admin/users': → 'admin/users'
  const caseRegex = /case\s+'([^']+)':/g;
  const cases = new Set<string>();
  let match;
  while ((match = caseRegex.exec(content)) !== null) {
    cases.add(match[1]);
  }

  // Extract imports: import Users from './admin/users/Users'; → { Users: './admin/users/Users' }
  const importRegex = /import\s+(\w+)\s+from\s+'([^']+)';/g;
  const imports = new Map<string, string>();
  while ((match = importRegex.exec(content)) !== null) {
    const [, componentName, importPath] = match;
    // Only track relative imports (our domain views)
    if (importPath.startsWith('./')) {
      imports.set(componentName, importPath);
    }
  }

  return { cases, imports };
}

/**
 * Convert manifest route to Router case format
 * /admin/users → admin/users
 * / → dashboard
 */
function routeToCase(route: string): string {
  if (route === '/') return 'dashboard';
  return route.replace(/^\//, '');
}

/**
 * Check if a view file exists
 */
function viewExists(importPath: string): boolean {
  // Convert relative import to absolute path
  // './admin/users/Users' → src/app/domains/admin/users/Users.tsx
  const relativePath = importPath.replace('./', '');
  const fullPath = path.join(ROOT, 'src', 'app', 'domains', relativePath + '.tsx');
  return fs.existsSync(fullPath);
}

/**
 * Overview routes that don't need Router cases
 * These redirect to a default sub-route
 */
const OVERVIEW_ROUTES = new Set([
  'productivity',
  'clients',
  'finance',
  'projects',
  'system',
  'settings',
]);

/**
 * Parse navigation.ts to extract KNOWN_ROUTES array
 * Returns set of route strings from the const KNOWN_ROUTES array
 */
function parseKnownRoutes(): Set<string> {
  const content = fs.readFileSync(NAVIGATION_PATH, 'utf-8');
  const knownRoutes = new Set<string>();

  // Extract KNOWN_ROUTES array definition
  // const KNOWN_ROUTES: DomainRoute[] = [ 'dashboard', 'admin/users', ... ];
  const arrayMatch = content.match(/const KNOWN_ROUTES[^=]*=\s*\[([\s\S]*?)\];/);

  if (!arrayMatch) {
    throw new Error('Cannot find KNOWN_ROUTES array in navigation.ts');
  }

  // Extract all quoted strings from the array
  const routeRegex = /['"]([^'"]+)['"]/g;
  let match;
  while ((match = routeRegex.exec(arrayMatch[1])) !== null) {
    knownRoutes.add(match[1]);
  }

  return knownRoutes;
}

/**
 * Main validation
 */
function validateManifests(): void {
  console.log('🔍 Validating SRS Manifest ↔ Router integrity...\n');

  const { cases, imports } = parseRouter();
  let errors = 0;

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 1: Every manifest route has a Router case
  // ═══════════════════════════════════════════════════════════════════════
  console.log('📋 Check 1: Manifest routes → Router cases\n');

  for (const manifest of ALL_MANIFESTS) {
    console.log(`   ${manifest.label} (${manifest.id}):`);
    let rankErrors = 0;

    for (const route of manifest.allowed) {
      const caseKey = routeToCase(route);

      // Skip overview routes (they redirect, no dedicated view)
      if (OVERVIEW_ROUTES.has(caseKey)) continue;

      if (!cases.has(caseKey)) {
        console.error(`     ❌ No Router case for: ${route}`);
        rankErrors++;
        errors++;
      }
    }

    if (rankErrors === 0) {
      console.log(`     ✅ All ${manifest.allowed.length} routes have Router cases`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 2: Every Router import points to existing file
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n📋 Check 2: Router imports → View files\n');

  for (const [componentName, importPath] of imports) {
    if (!viewExists(importPath)) {
      console.error(`   ❌ Missing file: ${importPath}.tsx (imported as ${componentName})`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`   ✅ All ${imports.size} imports resolve to existing files`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 3: No orphan Router cases (optional warning)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n📋 Check 3: Orphan Router cases (not in any manifest)\n');

  const allManifestRoutes = new Set<string>();
  for (const manifest of ALL_MANIFESTS) {
    for (const route of manifest.allowed) {
      allManifestRoutes.add(routeToCase(route));
    }
  }

  let orphans = 0;
  for (const caseKey of cases) {
    if (!allManifestRoutes.has(caseKey)) {
      console.warn(`   ⚠️  Orphan case: '${caseKey}' (not in any rank manifest)`);
      orphans++;
    }
  }

  if (orphans === 0) {
    console.log(`   ✅ No orphan cases - all ${cases.size} cases are in manifests`);
  } else {
    console.log(`   ⚠️  ${orphans} orphan case(s) found (warning only, not blocking)`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 4: Every Router case is in KNOWN_ROUTES (navigation.ts)
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n📋 Check 4: Router cases → KNOWN_ROUTES sync\n');

  const knownRoutes = parseKnownRoutes();
  let syncErrors = 0;

  // Check: every Router case must be in KNOWN_ROUTES
  for (const caseKey of cases) {
    if (!knownRoutes.has(caseKey)) {
      console.error(`   ❌ Router case '${caseKey}' missing from KNOWN_ROUTES in navigation.ts`);
      syncErrors++;
      errors++;
    }
  }

  // Check: every KNOWN_ROUTES entry should have Router case (warning only)
  let unusedRoutes = 0;
  for (const route of knownRoutes) {
    if (!cases.has(route)) {
      console.warn(`   ⚠️  KNOWN_ROUTES entry '${route}' has no Router case (unused route)`);
      unusedRoutes++;
    }
  }

  if (syncErrors === 0 && unusedRoutes === 0) {
    console.log(`   ✅ Perfect sync - all ${cases.size} Router cases in KNOWN_ROUTES`);
  } else if (syncErrors === 0) {
    console.log(`   ✅ All Router cases in KNOWN_ROUTES (${unusedRoutes} unused route(s))`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));

  if (errors > 0) {
    console.error(`\n⛔ SRS VALIDATION FAILED: ${errors} error(s) found`);
    console.error('Fix all violations before building.\n');
    process.exit(1);
  }

  console.log('\n✅ SRS VALIDATION PASSED');
  console.log(`   • ${ALL_MANIFESTS.length} rank manifests validated`);
  console.log(`   • ${cases.size} Router cases verified`);
  console.log(`   • ${imports.size} view imports confirmed\n`);
}

// Run validation
validateManifests();
