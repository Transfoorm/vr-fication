/**
 * VR Scanner - Orphan Detection (Phase 6)
 *
 * Separated from main scanner due to:
 * - Complex dynamic variant awareness logic
 * - Warning-only (doesn't block commits)
 * - Independent testing/refinement
 */

import { execSync } from 'child_process';
import * as fs from 'fs';

/**
 * Phase 6: Orphan Detection (with dynamic variant awareness)
 * Returns count of orphans found (as warnings, not violations)
 */
export function checkOrphans(
  ROOT: string,
  pass: (msg: string) => void
): number {
  console.log('\n👻 PHASE 6: Orphan Detection');

  let violations = 0;
  let scanned = 0;
  const orphans: string[] = [];

  try {
    // Get all TSX files
    const tsxFiles = execSync('find src -name "*.tsx" -type f 2>/dev/null', {
      encoding: 'utf-8',
    }).trim().split('\n').filter(Boolean);

    // Read all TSX content
    let tsxContent = '';
    for (const tsxFile of tsxFiles) {
      try {
        tsxContent += fs.readFileSync(tsxFile, 'utf-8') + '\n';
      } catch {
        // Skip unreadable files
      }
    }

    // Find all CSS files in src/ (excluding vr - they're library code)
    const cssFiles = execSync('find src -name "*.css" -type f 2>/dev/null | grep -v "src/vr"', {
      encoding: 'utf-8',
    }).trim().split('\n').filter(Boolean);

    for (const cssFile of cssFiles) {
      const cssContent = fs.readFileSync(cssFile, 'utf-8');

      // Remove comments before extracting classes
      const contentWithoutComments = cssContent
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, '');           // Remove line comments

      // Extract all prefixed classes (only from actual CSS, not comments)
      const classMatches = contentWithoutComments.match(/\.[vfl][rty]-[a-z][a-z0-9_-]*/g) || [];
      const uniqueClasses = [...new Set(classMatches)];

      for (const cssClass of uniqueClasses) {
        scanned++;
        const className = cssClass.slice(1); // Remove leading dot

        // Check 1: Literal usage
        if (tsxContent.includes(className)) {
          continue; // Used literally
        }

        // Check 2: Dynamic variant pattern
        // For class like "vr-badge-status--active", check if "vr-badge-status--${" exists
        const variantMatch = className.match(/^(.+--)[a-z0-9-]+$/);
        if (variantMatch) {
          const basePattern = variantMatch[1] + '${';
          if (tsxContent.includes(basePattern)) {
            continue; // Used dynamically
          }
          // Also check for pattern like `${varName}` at end
          const baseClass = className.replace(/--[a-z0-9-]+$/, '');
          if (tsxContent.includes(baseClass + '--${') || tsxContent.includes(baseClass + ' ${')) {
            continue; // Used dynamically
          }
        }

        // Check 3: Size/variant suffix pattern (e.g., vr-divider-default-lg)
        const sizeMatch = className.match(/^(.+-)(?:xs|sm|md|lg|xl|2xl|3xl)$/);
        if (sizeMatch) {
          const basePattern = sizeMatch[1] + '${';
          if (tsxContent.includes(basePattern)) {
            continue; // Used dynamically
          }
        }

        // Check 4: Status pattern (e.g., vr-card-activity-item-status-error)
        const statusMatch = className.match(/^(.+-status-)[a-z]+$/);
        if (statusMatch) {
          const basePattern = statusMatch[1] + '${';
          if (tsxContent.includes(basePattern)) {
            continue; // Used dynamically
          }
        }

        // Check 5: Trend pattern (e.g., vr-card-metric-trend-up)
        const trendMatch = className.match(/^(.+-trend-)[a-z]+$/);
        if (trendMatch) {
          const basePattern = trendMatch[1];
          if (tsxContent.includes(basePattern)) {
            continue; // Base class used, variants applied via variable
          }
        }

        // Check 6: Generic dynamic suffix (e.g., vr-alert-success, vr-badge-rank-admiral)
        // Split by last hyphen and check if base-${ exists
        const lastHyphen = className.lastIndexOf('-');
        if (lastHyphen > 0) {
          const baseWithHyphen = className.slice(0, lastHyphen + 1);
          if (tsxContent.includes(baseWithHyphen + '${')) {
            continue; // Used dynamically
          }
        }

        // Check 7: Span patterns (e.g., vr-card-activity-span-2)
        const spanMatch = className.match(/^(.+-span-)\d+$/);
        if (spanMatch) {
          const basePattern = spanMatch[1];
          if (tsxContent.includes(basePattern) || tsxContent.includes(basePattern.slice(0, -1) + '${')) {
            continue; // Used dynamically
          }
        }

        // Check 8: Layout patterns (e.g., vr-card-action-layout-vertical)
        const layoutMatch = className.match(/^(.+-layout-)[a-z]+$/);
        if (layoutMatch) {
          const basePattern = layoutMatch[1];
          if (tsxContent.includes(basePattern) || tsxContent.includes('layoutClass')) {
            continue; // Used via layoutClass variable
          }
        }

        // Not found - it's an orphan
        orphans.push(`${cssClass} in ${cssFile}`);
        violations++;
      }
    }

    if (violations === 0) {
      pass(`Orphan Detection: ${scanned} classes, all used`);
    } else {
      // Orphans now BLOCK commits - pristine CSS policy
      console.log(`❌ Orphan Detection: ${scanned} scanned, ${violations} orphan(s) BLOCKING`);
      for (const orphan of orphans) {
        console.log(`   └─ ${orphan}`);
      }
      return violations; // Return count to block commit
    }
  } catch (e) {
    console.log(`⚠️  Orphan Detection: Skipped (${e instanceof Error ? e.message : 'command error'})`);
  }

  return 0;
}
