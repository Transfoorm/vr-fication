#!/usr/bin/env tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ FUSE-STYLE NAMING GUARD                                           │
│  scripts/checkNaming.ts                                                │
│                                                                        │
│  Enforces FUSE-STYLE 7-layer naming conventions:                      │
│  - CSS files must be lowercase-kebab-case.css                         │
│  - CSS classes must be .kebab-case                                    │
│  - No PascalCase or camelCase in CSS                                  │
│                                                                        │
│  Usage: npm run check:naming                                          │
└────────────────────────────────────────────────────────────────────────┘ */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import * as path from 'path';

interface Violation {
  file: string;
  issue: string;
  line?: number;
  code?: string;
}

function getStagedCSSFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(file => file.endsWith('.css'))
      .filter(file => !file.includes('node_modules'))
      .filter(file => !file.includes('.next'))
      .filter(file => !file.startsWith('scripts/'));
  } catch {
    return [];
  }
}

function checkFilenameConvention(filePath: string): Violation | null {
  const fileName = path.basename(filePath);

  // Allowed system files
  const systemFiles = ['globals.css', 'index.css'];
  if (systemFiles.includes(fileName)) return null;

  // Check for lowercase kebab-case
  const hasUpperCase = /[A-Z]/.test(fileName.replace('.css', ''));
  const hasUnderscore = /_/.test(fileName.replace('.css', ''));

  if (hasUpperCase) {
    return {
      file: filePath,
      issue: `❌ FILENAME VIOLATION: "${fileName}" uses PascalCase/camelCase. Must be lowercase-kebab-case.css (e.g., "my-component.css")`,
    };
  }

  if (hasUnderscore) {
    return {
      file: filePath,
      issue: `❌ FILENAME VIOLATION: "${fileName}" uses underscores. Must use hyphens for kebab-case (e.g., "my-component.css" not "my_component.css")`,
    };
  }

  return null;
}

function checkCSSClassNames(filePath: string): Violation[] {
  if (!existsSync(filePath)) return [];

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    // Match CSS class definitions: .ClassName or .camelCase
    const classMatch = line.match(/\.([\w-]+)\s*\{/);
    if (classMatch) {
      const className = classMatch[1];

      // Check for PascalCase (starts with capital)
      if (/^[A-Z]/.test(className)) {
        violations.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          issue: `PascalCase class detected: ".${className}" should be kebab-case (e.g., ".${className.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}")`,
        });
      }

      // Check for camelCase (has uppercase but doesn't start with it)
      else if (/[A-Z]/.test(className)) {
        violations.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          issue: `camelCase class detected: ".${className}" should be kebab-case (e.g., ".${className.replace(/([A-Z])/g, '-$1').toLowerCase()}")`,
        });
      }
    }

    // Check CSS custom property names (CSS variables)
    const varMatch = line.match(/--([a-zA-Z][\w-]*)\s*:/);
    if (varMatch) {
      const varName = varMatch[1];

      // Check for camelCase in CSS variables
      if (/[A-Z]/.test(varName)) {
        violations.push({
          file: filePath,
          line: index + 1,
          code: line.trim(),
          issue: `camelCase CSS variable: "--${varName}" should be kebab-case (e.g., "--${varName.replace(/([A-Z])/g, '-$1').toLowerCase()}")`,
        });
      }
    }
  });

  return violations;
}

function main() {
  console.log('\n🛡️  FUSE-STYLE NAMING GUARD - Checking naming conventions...\n');

  const stagedFiles = getStagedCSSFiles();

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged CSS files to check.\n');
    process.exit(0);
  }

  console.log(`📂 Checking ${stagedFiles.length} CSS file(s):\n`);

  let totalViolations: Violation[] = [];

  stagedFiles.forEach(file => {
    // Check filename convention
    const filenameViolation = checkFilenameConvention(file);
    if (filenameViolation) {
      totalViolations.push(filenameViolation);
      console.log(`  ❌ ${file} - FILENAME VIOLATION`);
    } else {
      console.log(`  ✅ ${file} - filename OK`);
    }

    // Check class names inside the file
    const classViolations = checkCSSClassNames(file);
    if (classViolations.length > 0) {
      totalViolations = totalViolations.concat(classViolations);
      console.log(`     ⚠️  ${classViolations.length} class naming issue(s) found`);
    }
  });

  if (totalViolations.length > 0) {
    console.log('\n❌ FUSE-STYLE NAMING VIOLATIONS DETECTED!\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔥 NAMING CONVENTION VIOLATIONS - COMMIT BLOCKED            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    totalViolations.forEach(violation => {
      console.log(`  File: ${violation.file}${violation.line ? `:${violation.line}` : ''}`);
      console.log(`  Issue: ${violation.issue}`);
      if (violation.code) {
        console.log(`  Code: ${violation.code}`);
      }
      console.log('');
    });

    console.log('⛔ FIX REQUIRED:\n');
    console.log('  1. CSS files must use lowercase-kebab-case.css');
    console.log('  2. CSS classes must use .kebab-case (not .PascalCase or .camelCase)');
    console.log('  3. CSS variables must use --kebab-case (not --camelCase)');
    console.log('  4. See ~/Apps/~Transfoorm-SDK/02b-FUSE-STYLE-IMPLEMENTATION-GUIDE.md\n');
    console.log('🚨 Emergency Bypass (USE SPARINGLY):');
    console.log('  git commit --no-verify -m "your message"');
    console.log('  ⚠️  This bypasses ALL pre-commit checks - hotfixes only!\n');

    process.exit(1);
  }

  console.log('\n✅ FUSE-STYLE NAMING GUARD PASSED - All conventions followed!\n');
  process.exit(0);
}

main();
