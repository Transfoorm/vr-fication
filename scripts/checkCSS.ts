#!/usr/bin/env tsx

/**
 * 🛡️ VRP CSS GUARD - CSS Variable Enforcement
 *
 * Validates CSS files to ensure:
 * - No hardcoded hex colors (#rrggbb)
 * - No hardcoded rgb/rgba/hsl/hsla functions
 * - No magic numbers (all numeric values use CSS variables)
 * - All colors flow through CSS custom properties
 *
 * Part of the Virgin Repo Protocol (VRP) - prevents CSS theme bypasses
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';

console.log(`\n${CYAN}${BOLD}🛡️  VRP CSS GUARD - Checking CSS Variable Enforcement...${RESET}\n`);

// Check if stylelint is installed
const stylelintPath = join(process.cwd(), 'node_modules', '.bin', 'stylelint');

if (!existsSync(stylelintPath)) {
  console.error(`${RED}${BOLD}❌ stylelint not found!${RESET}`);
  console.error(`${YELLOW}Run: npm install --save-dev stylelint stylelint-config-standard${RESET}\n`);
  process.exit(1);
}

try {
  // Run stylelint on all CSS files
  execSync(
    `${stylelintPath} "**/*.css" --ignore-pattern "node_modules/**" --ignore-pattern ".next/**"`,
    {
      stdio: 'inherit',
      encoding: 'utf-8'
    }
  );

  console.log(`${GREEN}${BOLD}✅ VRP CSS GUARD PASSED - All CSS files comply with variable enforcement!${RESET}\n`);
  process.exit(0);
} catch {
  console.error(`\n${RED}${BOLD}❌ VRP CSS GUARD FAILED - CSS violations detected!${RESET}`);
  console.error(`${YELLOW}Fix the issues above or add legitimate exceptions to .stylelintrc.json${RESET}\n`);
  process.exit(1);
}
