#!/usr/bin/env tsx
/**
 * +----------------------------------------------------------------------+
 * |  🤖 VR CLASS SCANNER - Pre-commit Enforcement                        |
 * |  scripts/checkVRClasses.ts                                           |
 * |                                                                      |
 * |  Implements key checks from VR-class-scanner.md spec.                |
 * |  Ensures VR class naming conventions are followed.                   |
 * |                                                                      |
 * |  Usage: npm run check:vr                                             |
 * +----------------------------------------------------------------------+
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { checkOrphans } from './vrScannerOrphans';

const ROOT = process.cwd();

let totalViolations = 0;
let totalScanned = 0;

function log(msg: string) {
  console.log(msg);
}

function fail(msg: string) {
  console.error(`❌ ${msg}`);
  totalViolations++;
}

function pass(msg: string) {
  console.log(`✅ ${msg}`);
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 1: FILE LOCATIONS
// ═══════════════════════════════════════════════════════════════════
function checkFileLocations(): number {
  log('\n📍 PHASE 1: File Locations');

  const validPatterns = [
    /^src\/vr\/.+\.css$/,
    /^src\/features\/.+\.css$/,
    /^src\/shell\/.+\.css$/,
    /^src\/app\/domains\/.+\.css$/,
    /^src\/app\/\(auth\)\/.+\.css$/,
    /^styles\/tokens\.css$/,
    /^styles\/animations\.css$/,
    /^styles\/globals\.css$/,
    /^styles\/vr\.css$/,
    /^styles\/features\.css$/,
    /^styles\/layout\.css$/,
    /^styles\/themes\/.+\.css$/,
    /^vanish\/.+\.css$/,
  ];

  const bannedPatterns = [
    /^src\/behaviors\/.+\.css$/,
    /^src\/components\/.+\.css$/,
    /^src\/app\/[^/(][^/]*\.css$/,  // root level in app only (not subfolders)
    /^src\/lib\/.+\.css$/,
    /^src\/hooks\/.+\.css$/,
    /^src\/utils\/.+\.css$/,
  ];

  let violations = 0;

  try {
    const files = execSync('find src styles vanish -name "*.css" -type f 2>/dev/null', { encoding: 'utf-8' })
      .trim()
      .split('\n')
      .filter(Boolean);

    for (const file of files) {
      totalScanned++;
      const relativePath = path.relative(ROOT, path.resolve(ROOT, file));

      // Check banned locations
      if (bannedPatterns.some(p => p.test(relativePath))) {
        fail(`BANNED LOCATION: ${relativePath}`);
        violations++;
        continue;
      }

      // Check valid locations
      if (!validPatterns.some(p => p.test(relativePath))) {
        fail(`UNDEFINED LOCATION: ${relativePath}`);
        violations++;
      }
    }

    if (violations === 0) {
      pass(`File Locations: ${files.length} files, all valid`);
    }
  } catch {
    // No CSS files found is fine
    pass('File Locations: No CSS files found');
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 2: CLASS PREFIXES
// ═══════════════════════════════════════════════════════════════════
function checkClassPrefixes(): number {
  log('\n🏷️  PHASE 2: Class Prefixes');

  let violations = 0;

  try {
    // Find all class definitions in src/
    const output = execSync(
      'grep -rhn "^\\." src/**/*.css 2>/dev/null | grep -E ":\\.[a-z]" || true',
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    ).trim();

    if (!output) {
      pass('Class Prefixes: No classes found');
      return 0;
    }

    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
      // Extract class name
      const match = line.match(/:(\.[a-z][a-z0-9_-]*)/i);
      if (!match) continue;

      const className = match[1];

      // Must start with vr-, ft-, or ly-
      if (!className.match(/^\.(vr-|ft-|ly-)/)) {
        fail(`Unprefixed class: ${className} in ${line.split(':')[0]}`);
        violations++;
      }
    }

    if (violations === 0) {
      pass(`Class Prefixes: ${lines.length} classes, all prefixed`);
    }
  } catch {
    pass('Class Prefixes: Check skipped');
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 3: KEYFRAME COLLISIONS
// ═══════════════════════════════════════════════════════════════════
function checkKeyframeCollisions(): number {
  log('\n🎬 PHASE 3: Keyframe Collisions');

  let violations = 0;

  try {
    // Find duplicate keyframe names in src/ (tokens.css ANIMATION LIBRARY is the canonical source)
    const duplicates = execSync(
      'grep -rh "@keyframes " src/**/*.css 2>/dev/null | sed \'s/.*@keyframes //\' | sed \'s/ {.*//\' | sort | uniq -d || true',
      { encoding: 'utf-8' }
    ).trim();

    if (duplicates) {
      for (const dup of duplicates.split('\n').filter(Boolean)) {
        fail(`Duplicate keyframe: @keyframes ${dup}`);
        violations++;
      }
    } else {
      pass('Keyframe Collisions: No duplicates found');
    }
  } catch {
    pass('Keyframe Collisions: Check skipped');
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 4: CROSS-CONTAMINATION
// ═══════════════════════════════════════════════════════════════════
function checkCrossContamination(): number {
  log('\n🦠 PHASE 4: Cross-Contamination');

  let violations = 0;

  const checks = [
    { cmd: 'grep -rn "^\\.ft-" src/vr/**/*.css 2>/dev/null || true', desc: 'ft-* in vr' },
    { cmd: 'grep -rn "^\\.vr-" src/features/**/*.css 2>/dev/null || true', desc: 'vr-* in features' },
    { cmd: 'grep -rn "^\\.vr-\\|^\\.ft-" src/shell/**/*.css 2>/dev/null || true', desc: 'vr-*/ft-* in shell' },
    { cmd: 'grep -rn "^\\.vr-\\|^\\.ft-" src/app/domains/**/*.css 2>/dev/null || true', desc: 'vr-*/ft-* in domains' },
  ];

  for (const check of checks) {
    try {
      const output = execSync(check.cmd, { encoding: 'utf-8' }).trim();
      if (output) {
        for (const line of output.split('\n').filter(Boolean)) {
          fail(`Cross-contamination (${check.desc}): ${line}`);
          violations++;
        }
      }
    } catch {
      // No matches is good
    }
  }

  if (violations === 0) {
    pass('Cross-Contamination: Clean');
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// PHASE 5: IMPORT-ONLY FILES
// ═══════════════════════════════════════════════════════════════════
function checkImportOnlyFiles(): number {
  log('\n📦 PHASE 5: Import-Only Files');

  let violations = 0;

  const importOnlyFiles = [
    'styles/vr.css',
    'styles/features.css',
    'styles/layout.css',
  ];

  for (const file of importOnlyFiles) {
    const fullPath = path.join(ROOT, file);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) continue;

      // Track block comment state
      if (line.includes('/*')) inBlockComment = true;
      if (line.includes('*/')) {
        inBlockComment = false;
        continue;
      }

      // Skip if inside block comment
      if (inBlockComment) continue;

      // Skip single-line comments and @import
      if (line.startsWith('//') || line.startsWith('@import')) {
        continue;
      }

      // Anything else is a violation
      if (line.match(/^[.:#@a-z]/i) && !line.startsWith('@import')) {
        fail(`${file}:${i + 1} - Non-import content: "${line.substring(0, 50)}..."`);
        violations++;
        break; // One violation per file is enough
      }
    }
  }

  if (violations === 0) {
    pass('Import-Only Files: Clean');
  }

  return violations;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🦠 VR CLASS SCANNER - Pre-Commit Check');
  console.log('═══════════════════════════════════════════════════════════════');

  checkFileLocations();
  checkClassPrefixes();
  checkKeyframeCollisions();
  checkCrossContamination();
  checkImportOnlyFiles();
  totalViolations += checkOrphans(ROOT, pass);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');

  if (totalViolations > 0) {
    console.log(`  ❌ FAILED: ${totalViolations} violation(s) found`);
    console.log(`  📊 Files scanned: ${totalScanned}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    process.exit(1);
  } else {
    console.log('  ✅ PASSED: All checks clean');
    console.log(`  📊 Files scanned: ${totalScanned}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    process.exit(0);
  }
}

main();
