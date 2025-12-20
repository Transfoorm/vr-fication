#!/usr/bin/env tsx
/**──────────────────────────────────────────────────────────────────────┐
│  🧹 BUILDINFO CLEANUP SCRIPT                                          │
│  /scripts/cleanBuildinfo.ts                                           │
│                                                                        │
│  Removes stale TypeScript buildinfo files that accumulate during      │
│  builds and commits. Keeps only the main tsconfig.tsbuildinfo.        │
│                                                                        │
│  SAFE:                                                                 │
│  - Only removes files matching tsconfig.*.tsbuildinfo pattern         │
│  - Never removes the main tsconfig.tsbuildinfo                        │
│  - Dry run mode available                                             │
│                                                                        │
│  USAGE:                                                                │
│    npm run clean:buildinfo          # Delete stale buildinfo files    │
│    npm run clean:buildinfo -- --dry # Preview what would be deleted   │
└────────────────────────────────────────────────────────────────────────┘ */

import { readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

// Config
const ROOT_DIR = process.cwd();
const KEEP_FILE = 'tsconfig.tsbuildinfo'; // Main buildinfo to keep
const PATTERN = /^tsconfig\.[a-zA-Z0-9-]+\.tsbuildinfo$/; // Match: tsconfig.xyz123.tsbuildinfo or tsconfig.VRP.tsbuildinfo

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry') || args.includes('--dry-run');

/**
 * Find all stale buildinfo files
 */
function findStaleBuildinfos(): string[] {
  const files = readdirSync(ROOT_DIR);

  const staleFiles = files.filter(file => {
    // Must match pattern: tsconfig.<random>.tsbuildinfo
    if (!PATTERN.test(file)) {
      return false;
    }

    // Never delete the main buildinfo
    if (file === KEEP_FILE) {
      return false;
    }

    return true;
  });

  return staleFiles;
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filepath: string): number {
  const stats = statSync(filepath);
  return Math.round(stats.size / 1024);
}

/**
 * Delete stale buildinfo files
 */
function cleanBuildinfos() {
  console.log('🧹 TypeScript Buildinfo Cleanup\n');

  const staleFiles = findStaleBuildinfos();

  if (staleFiles.length === 0) {
    console.log('✅ No stale buildinfo files found. Nothing to clean!');
    return;
  }

  console.log(`Found ${staleFiles.length} stale buildinfo file(s):\n`);

  let totalSize = 0;

  // Show what will be deleted
  staleFiles.forEach(file => {
    const filepath = join(ROOT_DIR, file);
    const sizeKB = getFileSizeKB(filepath);
    totalSize += sizeKB;
    console.log(`  ${isDryRun ? '📋' : '🗑️ '} ${file} (${sizeKB}KB)`);
  });

  console.log(`\n💾 Total size: ${totalSize}KB\n`);

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No files were deleted.');
    console.log('   Run without --dry to actually delete these files.\n');
    return;
  }

  // Actually delete files
  let deletedCount = 0;
  let errorCount = 0;

  staleFiles.forEach(file => {
    const filepath = join(ROOT_DIR, file);
    try {
      unlinkSync(filepath);
      deletedCount++;
    } catch (error) {
      errorCount++;
      console.error(`❌ Failed to delete ${file}:`, error);
    }
  });

  console.log(`✅ Cleanup complete!`);
  console.log(`   Deleted: ${deletedCount} file(s)`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file(s)`);
  }
  console.log(`   Freed: ${totalSize}KB\n`);

  // Kept file info
  const keptPath = join(ROOT_DIR, KEEP_FILE);
  try {
    const keptSize = getFileSizeKB(keptPath);
    console.log(`📌 Kept: ${KEEP_FILE} (${keptSize}KB)\n`);
  } catch {
    // Main buildinfo doesn't exist (that's ok)
  }
}

// Run cleanup
try {
  cleanBuildinfos();
} catch (error) {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
}
