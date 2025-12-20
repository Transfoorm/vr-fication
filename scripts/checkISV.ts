#!/usr/bin/env tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ ISV PROTECTION - Real-time Inline Style Virus Detection           │
│  scripts/checkISV.ts                                                   │
│                                                                        │
│  Scans staged files for inline style violations before commit.        │
│  Part of the ISV Protection System.                                   │
│                                                                        │
│  Usage: npm run check:isv                                             │
└────────────────────────────────────────────────────────────────────────┘ */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

// FUSE-compliant exception files (allowed to have inline styles)
const EXCEPTION_FILES = new Set([
  // Phoenix Animation System (Dynamic Law - runtime transforms)
  'src/features/setup/FlyingButton/index.tsx',
  'src/features/setup/flying-button/index.tsx',  // CSS custom properties for positioning

  // Portal components (Dynamic Law - getBoundingClientRect positioning)
  'src/components/features/CountrySelector/index.tsx',
  'src/features/CountrySelector/index.tsx',
  'src/components/ui/Tooltip.tsx',
  'src/vr/modal/drawer/portal.tsx',
  'src/vr/tooltip/basic/index.tsx',
  'src/vr/tooltip/Basic.tsx',
  'src/vr/tooltip/TooltipBasic.tsx',  // VR tooltip with dynamic positioning

  // Dynamic gap configuration (CSS custom property for configurable spacing)
  'src/vr/fieldbox/row/index.tsx',

  // Range slider (Dynamic Law - runtime percentage positioning)
  'src/vr/input/range/index.tsx',

  // Data-driven components (Dynamic Law - runtime values/metadata)
  'src/vr/field/range/index.tsx',      // Runtime percentage positioning
  'src/vr/rank/card/index.tsx',        // CSS custom property bridges from metadata

  // Test/dev pages (temporary inline styles for quick testing)
  'src/app/domain/admin/tenant/page.tsx',     // VANISH 2 test page

  // UserButton (Dynamic import Cropper requires empty style/classes props)
  'src/features/UserButton/index.tsx',
  'src/features/shell/UserButton/index.tsx',
  'src/features/shell/user-button/index.tsx',  // react-easy-crop requires style prop

  // MirorAI star toggle (SVG particle circles need inline opacity:0 - CSS alone failed)
  'src/features/preferences/MirorAiTab/index.tsx',
  'src/features/preferences/miror-ai-tab/index.tsx',
]);

interface Violation {
  file: string;
  line: number;
  code: string;
}

function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf-8',
    });
    return output
      .trim()
      .split('\n')
      .filter(file => file.match(/\.(tsx|ts|jsx|js)$/))
      .filter(file => !file.includes('node_modules'))
      .filter(file => !file.includes('.next'))
      .filter(file => !file.startsWith('.archive/'));  // Ignore archived legacy code
  } catch {
    // If not in a git repo or no staged files, return empty array
    return [];
  }
}

function scanFileForISV(filePath: string): Violation[] {
  if (!existsSync(filePath)) return [];

  // Skip scripts directory (don't scan build/lint tools)
  if (filePath.startsWith('scripts/')) {
    return [];
  }

  // Skip exception files
  if (EXCEPTION_FILES.has(filePath)) {
    console.log(`  ✅ ${filePath} (exception file - skipped)`);
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    // Match inline style attribute with object syntax
    if (line.match(/\s+style\s*=\s*\{\{/)) {
      violations.push({
        file: filePath,
        line: index + 1,
        code: line.trim(),
      });
    }
  });

  if (violations.length === 0) {
    console.log(`  ✅ ${filePath}`);
  }

  return violations;
}

function main() {
  console.log('\n🛡️  ISV PROTECTION - Scanning for Inline Style Viruses...\n');

  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('ℹ️  No staged TypeScript/React files to check.\n');
    process.exit(0);
  }

  console.log(`📂 Scanning ${stagedFiles.length} staged file(s):\n`);

  let totalViolations: Violation[] = [];

  stagedFiles.forEach(file => {
    const violations = scanFileForISV(file);
    totalViolations = totalViolations.concat(violations);
  });

  if (totalViolations.length > 0) {
    console.log('\n❌ ISV VIOLATIONS DETECTED!\n');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  🔥 INLINE STYLE VIRUS DETECTED - COMMIT BLOCKED             ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    totalViolations.forEach(violation => {
      console.log(`  File: ${violation.file}:${violation.line}`);
      console.log(`  Code: ${violation.code}`);
      console.log('');
    });

    console.log('⛔ FIX REQUIRED:\n');
    console.log('  1. Extract inline styles to CSS files');
    console.log('  2. Use CSS classes with FUSE-STYLE architecture');
    console.log('  3. See ISVEA-REPORT.md for examples\n');
    console.log('📖 Documentation:');
    console.log('  - ISVEA-REPORT.md (cleanup examples)');
    console.log('  - ISVEA-EXCEPTIONS.md (allowed exceptions)\n');
    console.log('🚨 Emergency Bypass (USE SPARINGLY):');
    console.log('  git commit --no-verify -m "your message"');
    console.log('  ⚠️  This bypasses ALL pre-commit checks - hotfixes only!\n');

    process.exit(1);
  }

  console.log('\n✅ ISV PROTECTION PASSED - No violations detected!\n');
  process.exit(0);
}

main();
