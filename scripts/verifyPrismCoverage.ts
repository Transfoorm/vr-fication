/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ VRP: PRISM COVERAGE VERIFICATION                                  │
│  /scripts/verifyPrismCoverage.ts                                      │
│                                                                        │
│  TTTS-3 Enforcement: Ensures every nav domain has PRISM coverage      │
│  in the Sidebar's SECTION_TO_DOMAIN map.                              │
│                                                                        │
│  Checks:                                                               │
│  1. Sidebar has SECTION_TO_DOMAIN map                                 │
│  2. Every nav domain is registered in the map                         │
│  3. No orphan PRISM entries without nav domains                       │
└────────────────────────────────────────────────────────────────────────┘ */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

const SIDEBAR_PATH = 'src/shell/Sidebar/Sidebar.tsx';
const NAV_CONFIG_DIR = 'src/shell/Sidebar/navigation';

const RANKS = ['admiral', 'commodore', 'captain', 'crew'];

// Domains excluded from PRISM (Dashboard has no data to preload)
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

function extractDomainsFromNavConfig(content: string): string[] {
  // Only extract TOP-LEVEL nav sections (domains), not child routes
  // Pattern: { label: 'Domain', icon: '...' }
  const domains: string[] = [];
  const sectionPattern = /\{\s*label:\s*['"]([^'"]+)['"]\s*,\s*icon:/g;

  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(content)) !== null) {
    const domain = match[1].toLowerCase();
    if (!EXCLUDED_DOMAINS.includes(domain)) {
      domains.push(domain);
    }
  }

  // Dedupe
  return domains.filter((d, i) => domains.indexOf(d) === i);
}

function extractPrismDomains(sidebarContent: string): string[] {
  // Extract domains from SECTION_TO_DOMAIN map
  const domains: string[] = [];

  // Find the SECTION_TO_DOMAIN block using [\s\S] for cross-line matching
  const mapMatch = sidebarContent.match(/SECTION_TO_DOMAIN[^{]*\{([\s\S]*?)\}/);
  if (!mapMatch) {
    return [];
  }

  const mapContent = mapMatch[1];

  // Extract all domain keys (left side of colon)
  const keyPattern = /['"]?(\w+)['"]?\s*:/g;

  let match: RegExpExecArray | null;
  while ((match = keyPattern.exec(mapContent)) !== null) {
    domains.push(match[1].toLowerCase());
  }

  // Dedupe
  return domains.filter((d, i) => domains.indexOf(d) === i);
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 1: Sidebar has SECTION_TO_DOMAIN map
// ═══════════════════════════════════════════════════════════════════════

function checkPrismMapExists(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const content = readFile(SIDEBAR_PATH);

  if (!content.includes('SECTION_TO_DOMAIN')) {
    errors.push('Sidebar is missing SECTION_TO_DOMAIN map for PRISM preloading');
  }

  if (!content.includes('usePrism')) {
    errors.push('Sidebar is not using usePrism hook');
  }

  if (!content.includes('preloadDomain')) {
    errors.push('Sidebar is not calling preloadDomain');
  }

  return { passed: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════
// CHECK 2: Every nav domain has PRISM coverage
// ═══════════════════════════════════════════════════════════════════════

function checkPrismCoverage(): { passed: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get all domains from all nav configs
  const allNavDomains: string[] = [];

  for (let i = 0; i < RANKS.length; i++) {
    const rank = RANKS[i];
    try {
      const navContent = readFile(`${NAV_CONFIG_DIR}/${rank}.ts`);
      const domains = extractDomainsFromNavConfig(navContent);
      domains.forEach(d => {
        if (!allNavDomains.includes(d)) {
          allNavDomains.push(d);
        }
      });
    } catch {
      errors.push(`Cannot read nav config: ${rank}.ts`);
    }
  }

  // Get PRISM domains from Sidebar
  const sidebarContent = readFile(SIDEBAR_PATH);
  const prismDomains = extractPrismDomains(sidebarContent);

  if (prismDomains.length === 0) {
    errors.push('Could not extract domains from SECTION_TO_DOMAIN map');
    return { passed: false, errors, warnings };
  }

  // Check: every nav domain has PRISM coverage
  allNavDomains.forEach(domain => {
    if (!prismDomains.includes(domain)) {
      errors.push(`Nav domain "${domain}" missing from SECTION_TO_DOMAIN map`);
    }
  });

  // Check: no orphan PRISM entries (warning only)
  prismDomains.forEach(domain => {
    if (!allNavDomains.includes(domain)) {
      warnings.push(`PRISM entry "${domain}" not in any nav config`);
    }
  });

  return { passed: errors.length === 0, errors, warnings };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

function main() {
  console.log('\n🔮 PRISM COVERAGE VERIFICATION (TTTS-3)\n');
  console.log('Ensuring every nav domain has PRISM preload coverage...\n');

  let hasErrors = false;

  // Check 1: PRISM infrastructure exists
  console.log('⚙️  Check 1: PRISM infrastructure in Sidebar');
  const infraCheck = checkPrismMapExists();
  if (infraCheck.passed) {
    console.log('   ✅ SECTION_TO_DOMAIN map exists');
    console.log('   ✅ usePrism hook integrated');
    console.log('   ✅ preloadDomain called\n');
  } else {
    hasErrors = true;
    infraCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }

  // Check 2: All nav domains covered
  console.log('🔗 Check 2: Nav domain coverage');
  const coverageCheck = checkPrismCoverage();
  if (coverageCheck.passed) {
    console.log('   ✅ All nav domains have PRISM coverage\n');
  } else {
    hasErrors = true;
    coverageCheck.errors.forEach(e => console.log(`   ❌ ${e}`));
    console.log();
  }
  if (coverageCheck.warnings.length > 0) {
    coverageCheck.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    console.log();
  }

  // Final result
  console.log('─'.repeat(60));
  if (hasErrors) {
    console.log('\n❌ PRISM COVERAGE FAILED\n');
    console.log('⛔ TTTS-3 VIOLATION: Not all domains have PRISM preload triggers.');
    console.log('   Every domain dropdown click MUST trigger PRISM preload.');
    console.log('   Add missing domains to SECTION_TO_DOMAIN in Sidebar.tsx\n');
    process.exit(1);
  } else {
    console.log('\n✅ PRISM COVERAGE VERIFIED\n');
    console.log('   All nav domains have PRISM preload triggers.');
    console.log('   Dropdown click → instant data. Zero delay.\n');
  }
}

main();
