#!/usr/bin/env tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ VRP TYPOGRAPHY SOVEREIGNTY CHECK                                  │
│  /scripts/checkTypography.ts                                          │
│                                                                        │
│  Enforces Typography VR sovereignty by blocking font properties       │
│  in feature, shell, and domain CSS files.                             │
│                                                                        │
│  Typography VRs are the SOLE authority for font decisions.            │
│  Feature CSS may not define font-size, font-weight, or font-family.   │
└────────────────────────────────────────────────────────────────────────┘ */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('\n🛡️  VRP TYPOGRAPHY SOVEREIGNTY CHECK\n');

// Get staged files
let stagedFiles: string[] = [];
try {
  const result = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf-8' });
  stagedFiles = result
    .trim()
    .split('\n')
    .filter(file => file.endsWith('.css') && existsSync(file));
} catch {
  console.log('ℹ️  No staged CSS files to check.\n');
  process.exit(0);
}

if (stagedFiles.length === 0) {
  console.log('ℹ️  No staged CSS files to check.\n');
  process.exit(0);
}

// Filter for feature/shell/domain CSS (not vr/typography, not globals)
const featureFiles = stagedFiles.filter(file =>
  (file.includes('src/features/') ||
   file.includes('src/shell/') ||
   file.includes('src/app/domains/')) &&
  !file.includes('src/vr/typography/') &&
  !file.includes('styles/globals.css') &&
  !file.includes('styles/tokens.css')
);

if (featureFiles.length === 0) {
  console.log('✅ No feature CSS files to check.\n');
  process.exit(0);
}

console.log(`📂 Checking ${featureFiles.length} feature CSS file(s) for font violations:\n`);

let totalViolations = 0;
const violatedFiles: string[] = [];

for (const file of featureFiles) {
  let fileViolations = 0;

  // Check for font-size
  try {
    const fontSizeResult = execSync(`grep -n "font-size" "${file}" || true`, { encoding: 'utf-8' }).trim();
    if (fontSizeResult) {
      if (fileViolations === 0) {
        console.log(`❌ ${file}:`);
        violatedFiles.push(file);
      }
      console.log(fontSizeResult);
      fileViolations += fontSizeResult.split('\n').length;
    }
  } catch {
    // grep returns exit code 1 if no matches, which is what we want
  }

  // Check for font-weight
  try {
    const fontWeightResult = execSync(`grep -n "font-weight" "${file}" || true`, { encoding: 'utf-8' }).trim();
    if (fontWeightResult) {
      if (fileViolations === 0) {
        console.log(`❌ ${file}:`);
        violatedFiles.push(file);
      }
      console.log(fontWeightResult);
      fileViolations += fontWeightResult.split('\n').length;
    }
  } catch {
    // grep returns exit code 1 if no matches, which is what we want
  }

  // Check for font-family (except inherit and monospace)
  try {
    const fontFamilyResult = execSync(
      `grep -n "font-family" "${file}" | grep -v "inherit" | grep -v "monospace" || true`,
      { encoding: 'utf-8' }
    ).trim();
    if (fontFamilyResult) {
      if (fileViolations === 0) {
        console.log(`❌ ${file}:`);
        violatedFiles.push(file);
      }
      console.log(fontFamilyResult);
      fileViolations += fontFamilyResult.split('\n').length;
    }
  } catch {
    // grep returns exit code 1 if no matches, which is what we want
  }

  if (fileViolations > 0) {
    console.log('');
    totalViolations += fileViolations;
  }
}

if (totalViolations > 0) {
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('❌ TYPOGRAPHY SOVEREIGNTY VIOLATION DETECTED\n');
  console.log(`Found ${totalViolations} font property declaration(s) in ${violatedFiles.length} file(s).\n`);
  console.log('Typography VRs are the SOLE authority for font decisions.');
  console.log('Feature CSS may not define font-size, font-weight, or font-family.\n');
  console.log('Fix:');
  console.log('  1. Remove font properties from CSS');
  console.log('  2. Use Typography VR props instead (T.body, T.h2, T.caption, etc.)\n');
  console.log('Example:');
  console.log('  ❌ CSS:  .ft-thing { font-size: 18px; font-weight: 600; }');
  console.log('  ✅ TSX:  <T.body size="lg" weight="semibold">Text</T.body>\n');
  console.log('See: /T-VR slash command for Typography VR guidance\n');
  process.exit(1);
}

console.log('✅ TYPOGRAPHY SOVEREIGNTY MAINTAINED\n');
console.log('   All feature CSS is free of font properties.');
console.log('   Typography VRs remain the sole text authority.\n');
process.exit(0);
