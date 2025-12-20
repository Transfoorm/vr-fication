/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ VRP: WARP-NAV SYNC VERIFICATION                                   │
│  /scripts/verifyWarpNavSync.ts                                        │
│                                                                        │
│  TTTS-4 Enforcement: Ensures WARP Orchestrator stays synced with      │
│  sidebar navigation configs. Catches maverick hardcoding.             │
│                                                                        │
│  Checks:                                                               │
│  1. Orchestrator imports all rank nav configs                         │
│  2. No hardcoded domain arrays in orchestrator                        │
│  3. Every nav domain has matching /api/warp/{domain} endpoint         │
│  4. No orphan WARP endpoints without nav entries                      │
└────────────────────────────────────────────────────────────────────────┘ */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const ORCHESTRATOR_PATH = 'src/fuse/warp/orchestrator.ts';
const NAV_CONFIG_DIR = 'src/shell/sidebar/navigation';
const WARP_API_DIR = 'src/app/api/warp';

const RANKS = ['admiral', 'commodore', 'captain', 'crew'] as const;

// Domains that are excluded from WARP (Dashboard is navigation-only)
const EXCLUDED_DOMAINS = ['dashboard'];

// ═══════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════

function readFile(relativePath: string): string {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function getDirectories(relativePath: string): string[] {
  const fullPath = path.join(ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  return fs.readdirSync(fullPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

function extractDomainsFromNavConfig(content: string): string[] {
  // Only extract TOP-LEVEL nav sections (domains), not child routes
  // Pattern: NavSection[] array with top-level { label: 'Domain', ... }
  // We look for labels that are NOT inside a children: [] block

  const domains: string[] = [];

  // Match top-level section objects: { label: 'Domain', icon: '...' }
  // These are the main nav sections, not child items
  const sectionPattern = /{\s*label:\s*['"]([^'"]+)['"]\s*,\s*icon:/g;
  const matches = content.matchAll(sectionPattern);

  for (const match of matches) {
    const domain = match[1].toLowerCase();
    if (!EXCLUDED_DOMAINS.includes(domain)) {
      domains.push(domain);
    }
  }

  return [...new Set(domains)]; // Dedupe
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 1: Orchestrator imports nav configs
// ═══════════════════════════════════════════════════════════════════════

function checkOrchestratorImports(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const content = readFile(ORCHESTRATOR_PATH);

  for (const rank of RANKS) {
    const importPattern = new RegExp(`from\\s+['"]@/shell/sidebar/navigation/${rank}['"]`);
    if (!importPattern.test(content)) {
      errors.push(`Missing import from navigation/${rank}.ts`);
    }
  }

  return { passed: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 2: No hardcoded domain arrays
// ═══════════════════════════════════════════════════════════════════════

function checkNoHardcodedDomains(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const content = readFile(ORCHESTRATOR_PATH);

  // Pattern: array literal with domain-like strings
  // e.g., ['clients', 'finance', 'productivity']
  const hardcodedArrayPattern = /\[\s*['"](?:clients|finance|productivity|projects|admin|system|settings)['"]\s*(?:,\s*['"][a-z]+['"]\s*)*\]/gi;

  const matches = content.match(hardcodedArrayPattern);
  if (matches) {
    for (const match of matches) {
      // Skip if it's inside a comment
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes(match) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          errors.push(`Hardcoded domain array detected: ${match}`);
        }
      }
    }
  }

  // Also check for switch/case with hardcoded rank->domain mappings
  const switchPattern = /case\s+['"](?:admiral|commodore|captain|crew)['"]\s*:\s*(?:return|domains\s*=)\s*\[/gi;
  if (switchPattern.test(content)) {
    errors.push('Hardcoded rank→domain switch/case detected. Use navByRank instead.');
  }

  return { passed: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 3: Every nav domain has WARP endpoint
// ═══════════════════════════════════════════════════════════════════════

function checkWarpEndpoints(): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all domains from all nav configs
  const allNavDomains = new Set<string>();

  for (const rank of RANKS) {
    try {
      const navContent = readFile(`${NAV_CONFIG_DIR}/${rank}.ts`);
      const domains = extractDomainsFromNavConfig(navContent);
      domains.forEach(d => allNavDomains.add(d));
    } catch {
      errors.push(`Cannot read nav config: ${rank}.ts`);
    }
  }

  // Get all WARP API endpoints
  const warpEndpoints = getDirectories(WARP_API_DIR);

  // Check: every nav domain has WARP endpoint
  for (const domain of allNavDomains) {
    if (!warpEndpoints.includes(domain)) {
      errors.push(`Nav domain "${domain}" missing WARP endpoint at /api/warp/${domain}`);
    }
  }

  // Check: no orphan WARP endpoints (warning only)
  for (const endpoint of warpEndpoints) {
    if (!allNavDomains.has(endpoint) && endpoint !== 'dashboard') {
      warnings.push(`Orphan WARP endpoint "/api/warp/${endpoint}" not in any nav config`);
    }
  }

  return { passed: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 4: Orchestrator uses getDomainsForRank pattern
// ═══════════════════════════════════════════════════════════════════════

function checkDomainDerivation(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const content = readFile(ORCHESTRATOR_PATH);

  // Must have navByRank mapping
  if (!content.includes('navByRank')) {
    errors.push('Missing navByRank mapping. Domains must derive from nav configs.');
  }

  // Must have getDomainsForRank or similar function that reads from nav
  if (!content.includes('getDomainsForRank') && !content.includes('nav.filter') && !content.includes('nav.map')) {
    errors.push('Missing domain extraction from nav config. Must use getDomainsForRank pattern.');
  }

  return { passed: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

function main() {
  console.log('\n🛡️  WARP-NAV SYNC VERIFICATION (TTTS-4)\n');
  console.log('Ensuring WARP Orchestrator stays synced with sidebar navigation...\n');

  let hasErrors = false;

  // Check 1: Imports
  console.log('📦 Check 1: Orchestrator imports nav configs');
  const importCheck = checkOrchestratorImports();
  if (importCheck.passed) {
    console.log('   ✅ All rank nav configs imported\n');
  } else {
    hasErrors = true;
    importCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }

  // Check 2: No hardcoded domains
  console.log('🔍 Check 2: No hardcoded domain arrays');
  const hardcodeCheck = checkNoHardcodedDomains();
  if (hardcodeCheck.passed) {
    console.log('   ✅ No hardcoded domain arrays detected\n');
  } else {
    hasErrors = true;
    hardcodeCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }

  // Check 3: WARP endpoints match nav
  console.log('🔗 Check 3: WARP endpoints match nav domains');
  const endpointCheck = checkWarpEndpoints();
  if (endpointCheck.passed) {
    console.log('   ✅ All nav domains have WARP endpoints\n');
  } else {
    hasErrors = true;
    endpointCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }
  if (endpointCheck.warnings.length > 0) {
    endpointCheck.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    console.log();
  }

  // Check 4: Domain derivation pattern
  console.log('⚙️  Check 4: Domain derivation from nav configs');
  const derivationCheck = checkDomainDerivation();
  if (derivationCheck.passed) {
    console.log('   ✅ Domains derived from nav configs\n');
  } else {
    hasErrors = true;
    derivationCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }

  // Final result
  console.log('─'.repeat(60));
  if (hasErrors) {
    console.log('\n❌ WARP-NAV SYNC FAILED\n');
    console.log('⛔ TTTS-4 VIOLATION: WARP Orchestrator is not synced with nav configs.');
    console.log('   Domains must derive from sidebar navigation, not hardcoded arrays.');
    console.log('   See: docs/06-warp-orchestrator/warp-prism-synergy.md\n');
    process.exit(1);
  } else {
    console.log('\n✅ WARP-NAV SYNC VERIFIED\n');
    console.log('   WARP Orchestrator correctly derives domains from nav configs.');
    console.log('   Maverick hardcoding blocked.\n');
  }
}

main();
