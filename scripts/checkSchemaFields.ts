#!/usr/bin/env npx tsx
/**
 * TTT SCHEMA FIELD SCANNER v3.0
 *
 * Comprehensive schema analysis with multiple checks:
 *
 * PHASE 1: Field Classification (required vs optional)
 *   REQUIRED + INDEXED = ✅ Correct
 *   REQUIRED + FK      = ✅ Correct
 *   REQUIRED + neither = ⚠️ Review
 *   OPTIONAL + INDEXED = 🔶 Review
 *   OPTIONAL + FK      = 🔗 Correct
 *   OPTIONAL + neither = ⚪ Correct
 *
 * PHASE 2: Timestamp Consistency
 *   Every table should have createdAt and updatedAt
 *
 * PHASE 3: Naming Consistency
 *   Detect userId vs user_id vs ownerId drift
 *
 * PHASE 4: String-to-FK Detection
 *   Find v.string() fields that should be v.id("table")
 *
 * Usage:
 *   npx tsx scripts/checkSchemaFields.ts           # Normal scan
 *   npx tsx scripts/checkSchemaFields.ts --nuke    # Post-nuke mode
 */

import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'convex/schema.ts');
const isNukeMode = process.argv.includes('--nuke');

interface FieldInfo {
  name: string;
  isOptional: boolean;
  isId: boolean;
  idTarget?: string;
  isInIndex: boolean;
  indexNames: string[];
  line: number;
  tableName: string;
  rawType: string; // The v.xxx type (string, number, id, etc.)
}

interface TableInfo {
  name: string;
  fields: FieldInfo[];
  indexes: string[];
  startLine: number;
}

function parseSchema(): TableInfo[] {
  const content = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  const lines = content.split('\n');
  const tables: TableInfo[] = [];

  let currentTable: TableInfo | null = null;
  let braceDepth = 0;
  let inDefineTable = false;
  let indexSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect table start: tableName: defineTable({
    const tableMatch = line.match(/^\s*(\w+):\s*defineTable\(\{/);
    if (tableMatch) {
      currentTable = {
        name: tableMatch[1],
        fields: [],
        indexes: [],
        startLine: lineNum,
      };
      braceDepth = 1;
      inDefineTable = true;
      indexSection = false;
      continue;
    }

    if (!currentTable || !inDefineTable) continue;

    // Track brace depth
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    braceDepth += openBraces - closeBraces;

    // Detect index section: }).index("name", ["field1", "field2"])
    const indexMatch = line.match(/\.index\(\s*["'](\w+)["']\s*,\s*\[(.*?)\]\s*\)/g);
    if (indexMatch) {
      indexSection = true;
      for (const idx of indexMatch) {
        const idxParts = idx.match(/\.index\(\s*["'](\w+)["']\s*,\s*\[(.*?)\]\s*\)/);
        if (idxParts) {
          const indexName = idxParts[1];
          const fieldsStr = idxParts[2];
          const fieldNames = fieldsStr.match(/["']([^"']+)["']/g)?.map(f => f.replace(/["']/g, '')) || [];

          currentTable.indexes.push(indexName);

          for (const fieldName of fieldNames) {
            const baseField = fieldName.split('.')[0];
            const existingField = currentTable.fields.find(f => f.name === baseField);
            if (existingField) {
              existingField.isInIndex = true;
              existingField.indexNames.push(indexName);
            }
          }
        }
      }
    }

    // Detect field definitions (only before index section)
    if (!indexSection && braceDepth >= 1) {
      const fieldMatch = line.match(/^\s*(\w+):\s*v\.(\w+)\((.*)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const vType = fieldMatch[2];
        const rest = fieldMatch[3];

        const idMatch = rest.match(/^["'](\w+)["']/);

        const field: FieldInfo = {
          name: fieldName,
          isOptional: vType === 'optional',
          isId: vType === 'id' || (vType === 'optional' && rest.includes('v.id(')),
          idTarget: idMatch ? idMatch[1] : undefined,
          isInIndex: false,
          indexNames: [],
          line: lineNum,
          tableName: currentTable.name,
          rawType: vType,
        };

        if (vType === 'optional') {
          const innerIdMatch = rest.match(/v\.id\(\s*["'](\w+)["']\s*\)/);
          if (innerIdMatch) {
            field.isId = true;
            field.idTarget = innerIdMatch[1];
          }
        }

        currentTable.fields.push(field);
      }
    }

    if (braceDepth === 0 && line.includes('),')) {
      tables.push(currentTable);
      currentTable = null;
      inDefineTable = false;
    }
  }

  if (currentTable) {
    tables.push(currentTable);
  }

  return tables;
}

interface AnalysisResult {
  totalFields: number;
  requiredIndexed: number;
  requiredFK: number;
  requiredReview: number;
  optionalIndexed: number;
  optionalFK: number;
  optionalCorrect: number;
  nukeOpportunities: FieldInfo[];
  reviewItems: string[];
}

function analyzeFields(tables: TableInfo[]): AnalysisResult {
  const result: AnalysisResult = {
    totalFields: 0,
    requiredIndexed: 0,
    requiredFK: 0,
    requiredReview: 0,
    optionalIndexed: 0,
    optionalFK: 0,
    optionalCorrect: 0,
    nukeOpportunities: [],
    reviewItems: [],
  };

  console.log('\n' + '═'.repeat(70));
  console.log(isNukeMode
    ? '  TTT SCHEMA FIELD SCANNER - POST-NUKE MODE'
    : '  TTT SCHEMA FIELD SCANNER');
  console.log('═'.repeat(70));

  for (const table of tables) {
    console.log(`\n📋 ${table.name}`);
    console.log('─'.repeat(60));

    for (const field of table.fields) {
      result.totalFields++;
      field.tableName = table.name;

      let status = '';
      let icon = '';

      if (field.isInIndex && !field.isOptional) {
        // ✅ REQUIRED + INDEXED = Correct
        icon = '✅';
        status = `Required + indexed (${field.indexNames.join(', ')})`;
        result.requiredIndexed++;
      } else if (field.isId && !field.isOptional) {
        // ✅ REQUIRED + FK = Correct
        icon = '✅';
        status = `Required FK → ${field.idTarget}`;
        result.requiredFK++;
      } else if (!field.isOptional && !field.isInIndex && !field.isId) {
        // ⚠️ REQUIRED + neither = Review
        icon = '⚠️';
        status = 'Required (not indexed, not FK) - verify core';
        result.requiredReview++;
        result.reviewItems.push(`${table.name}.${field.name}: Required but not indexed/FK`);
      } else if (field.isInIndex && field.isOptional) {
        // 🔶 OPTIONAL + INDEXED = Review
        icon = '🔶';
        status = `Optional + indexed (${field.indexNames.join(', ')}) - won't find nulls`;
        result.optionalIndexed++;
        result.reviewItems.push(`${table.name}.${field.name}: Optional + indexed`);
      } else if (field.isId && field.isOptional) {
        // 🔗 OPTIONAL + FK = Correct (nullable relationship)
        icon = '🔗';
        status = `Optional FK → ${field.idTarget} (nullable)`;
        result.optionalFK++;
      } else if (field.isOptional) {
        // ⚪ OPTIONAL + neither = Correct (preference/enhancement)
        // In nuke mode, these are upgrade opportunities
        if (isNukeMode) {
          icon = '🎯';
          status = 'NUKE OPPORTUNITY - could upgrade to required';
          result.nukeOpportunities.push(field);
        } else {
          icon = '⚪';
          status = 'Optional (preference/enhancement)';
        }
        result.optionalCorrect++;
      }

      console.log(`  ${icon} ${field.name}: ${status}`);
    }
  }

  return result;
}

function printSummary(result: AnalysisResult) {
  console.log('\n' + '═'.repeat(70));
  console.log('  SUMMARY');
  console.log('═'.repeat(70));

  console.log(`
  Total fields scanned: ${result.totalFields}

  REQUIRED FIELDS:
    ✅ Indexed:     ${result.requiredIndexed}
    ✅ Foreign Key: ${result.requiredFK}
    ⚠️  Review:      ${result.requiredReview}

  OPTIONAL FIELDS:
    🔶 Indexed:     ${result.optionalIndexed} (won't find null rows)
    🔗 Foreign Key: ${result.optionalFK} (nullable relationships)
    ⚪ Correct:     ${result.optionalCorrect}
  `);

  if (result.reviewItems.length > 0) {
    console.log('  ⚠️  REVIEW THESE:');
    for (const item of result.reviewItems) {
      console.log(`     - ${item}`);
    }
    console.log();
  }

  // NUKE OPPORTUNITY section
  if (isNukeMode && result.nukeOpportunities.length > 0) {
    console.log('═'.repeat(70));
    console.log('  🎯 NUKE OPPORTUNITIES');
    console.log('═'.repeat(70));
    console.log(`
  These ${result.nukeOpportunities.length} optional fields could become REQUIRED now that the DB is empty.
  No migration needed - just change v.optional(...) to the inner type.

  Ask yourself: "Does this field ALWAYS have a value in practice?"
  If YES → upgrade to required (stronger schema, better guarantees)
  If NO  → keep optional (null has meaning)
`);

    // Group by table
    const byTable = new Map<string, FieldInfo[]>();
    for (const field of result.nukeOpportunities) {
      const existing = byTable.get(field.tableName) || [];
      existing.push(field);
      byTable.set(field.tableName, existing);
    }

    for (const [tableName, fields] of byTable) {
      console.log(`  📋 ${tableName}:`);
      for (const field of fields) {
        console.log(`     🎯 ${field.name} (line ${field.line})`);
      }
      console.log();
    }
  }

  // TTT Rules
  console.log('═'.repeat(70));
  console.log('  TTT RULES (PURE, NO HARDCODED LISTS)');
  console.log('═'.repeat(70));
  console.log(`
  REQUIRED + INDEXED = ✅ Correct (index needs consistent values)
  REQUIRED + FK      = ✅ Correct (relationship is mandatory)
  REQUIRED + neither = ⚠️ Review (is this truly core data?)

  OPTIONAL + INDEXED = 🔶 Review (index won't find null rows)
  OPTIONAL + FK      = 🔗 Correct (nullable relationship)
  OPTIONAL + neither = ⚪ Correct (preference/enhancement)
  `);

  if (isNukeMode) {
    console.log('═'.repeat(70));
    console.log('  POST-NUKE PROTOCOL');
    console.log('═'.repeat(70));
    console.log(`
  You just nuked the database. This is the PERFECT time to:

  1. Review 🎯 NUKE OPPORTUNITIES above
  2. For each field, ask: "Will this ALWAYS have a value?"
  3. If YES: Change v.optional(v.xxx()) to v.xxx()
  4. Run \`npx convex dev\` to apply schema changes
  5. Your DB is now ROCK SOLID - no optional debt!
  `);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: TIMESTAMP CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════

interface TimestampResult {
  tablesWithBoth: string[];
  tablesMissingCreatedAt: string[];
  tablesMissingUpdatedAt: string[];
  tablesMissingBoth: string[];
}

function checkTimestampConsistency(tables: TableInfo[]): TimestampResult {
  const result: TimestampResult = {
    tablesWithBoth: [],
    tablesMissingCreatedAt: [],
    tablesMissingUpdatedAt: [],
    tablesMissingBoth: [],
  };

  for (const table of tables) {
    const fieldNames = table.fields.map(f => f.name);
    const hasCreatedAt = fieldNames.includes('createdAt');
    const hasUpdatedAt = fieldNames.includes('updatedAt');

    if (hasCreatedAt && hasUpdatedAt) {
      result.tablesWithBoth.push(table.name);
    } else if (!hasCreatedAt && !hasUpdatedAt) {
      result.tablesMissingBoth.push(table.name);
    } else if (!hasCreatedAt) {
      result.tablesMissingCreatedAt.push(table.name);
    } else {
      result.tablesMissingUpdatedAt.push(table.name);
    }
  }

  return result;
}

function printTimestampResults(result: TimestampResult) {
  console.log('\n' + '═'.repeat(70));
  console.log('  PHASE 2: TIMESTAMP CONSISTENCY');
  console.log('═'.repeat(70));

  const total = result.tablesWithBoth.length +
    result.tablesMissingCreatedAt.length +
    result.tablesMissingUpdatedAt.length +
    result.tablesMissingBoth.length;

  console.log(`
  Tables with both createdAt + updatedAt: ${result.tablesWithBoth.length}/${total}
  `);

  if (result.tablesMissingBoth.length > 0) {
    console.log('  🚨 Missing BOTH timestamps:');
    for (const t of result.tablesMissingBoth) {
      console.log(`     - ${t}`);
    }
    console.log();
  }

  if (result.tablesMissingCreatedAt.length > 0) {
    console.log('  ⚠️  Missing createdAt:');
    for (const t of result.tablesMissingCreatedAt) {
      console.log(`     - ${t}`);
    }
    console.log();
  }

  if (result.tablesMissingUpdatedAt.length > 0) {
    console.log('  ⚠️  Missing updatedAt:');
    for (const t of result.tablesMissingUpdatedAt) {
      console.log(`     - ${t}`);
    }
    console.log();
  }

  if (result.tablesMissingBoth.length === 0 &&
      result.tablesMissingCreatedAt.length === 0 &&
      result.tablesMissingUpdatedAt.length === 0) {
    console.log('  ✅ All tables have consistent timestamps!');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: NAMING CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════

interface NamingResult {
  patterns: Map<string, { tables: string[]; fields: string[] }>;
  issues: string[];
}

function checkNamingConsistency(tables: TableInfo[]): NamingResult {
  const result: NamingResult = {
    patterns: new Map(),
    issues: [],
  };

  // Common patterns to check for consistency
  // Only flag TRUE inconsistencies (same concept, different naming)
  const patternGroups = [
    // Same field, different case style
    ['userId', 'user_id'],
    ['orgId', 'org_id'],
    ['createdAt', 'created_at'],
    ['updatedAt', 'updated_at'],
    ['ownerId', 'owner_id'],
    ['createdBy', 'created_by'],
  ];

  // Collect all field names and where they appear
  const fieldOccurrences = new Map<string, { table: string; line: number }[]>();

  for (const table of tables) {
    for (const field of table.fields) {
      const existing = fieldOccurrences.get(field.name) || [];
      existing.push({ table: table.name, line: field.line });
      fieldOccurrences.set(field.name, existing);
    }
  }

  // Check each pattern group for inconsistency
  for (const group of patternGroups) {
    const found: string[] = [];
    for (const pattern of group) {
      if (fieldOccurrences.has(pattern)) {
        found.push(pattern);
      }
    }

    // If multiple patterns from same group are used, that's inconsistent
    if (found.length > 1) {
      result.issues.push(
        `Mixed naming: ${found.join(' vs ')} (pick one pattern)`
      );

      for (const pattern of found) {
        const occurrences = fieldOccurrences.get(pattern) || [];
        const tables = [...new Set(occurrences.map(o => o.table))];
        result.patterns.set(pattern, {
          tables,
          fields: occurrences.map(o => `${o.table}:${o.line}`),
        });
      }
    }
  }

  // Check for snake_case in a camelCase codebase
  for (const [fieldName, occurrences] of fieldOccurrences) {
    if (fieldName.includes('_') && !fieldName.startsWith('_')) {
      // Skip known exceptions like _storage
      result.issues.push(
        `Snake_case field: ${fieldName} in ${occurrences.map(o => o.table).join(', ')}`
      );
    }
  }

  return result;
}

function printNamingResults(result: NamingResult) {
  console.log('\n' + '═'.repeat(70));
  console.log('  PHASE 3: NAMING CONSISTENCY');
  console.log('═'.repeat(70));

  if (result.issues.length === 0) {
    console.log('\n  ✅ All field names follow consistent patterns!\n');
    return;
  }

  console.log(`\n  Found ${result.issues.length} naming inconsistencies:\n`);

  for (const issue of result.issues) {
    console.log(`  ⚠️  ${issue}`);
  }

  if (result.patterns.size > 0) {
    console.log('\n  Pattern breakdown:');
    for (const [pattern, info] of result.patterns) {
      console.log(`     ${pattern}: used in ${info.tables.join(', ')}`);
    }
  }

  console.log();
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: STRING-TO-FK DETECTION
// ═══════════════════════════════════════════════════════════════════════════

interface StringToFKResult {
  suspects: Array<{
    table: string;
    field: string;
    line: number;
    suggestion: string;
  }>;
}

function checkStringToFK(tables: TableInfo[]): StringToFKResult {
  const result: StringToFKResult = { suspects: [] };

  // Patterns that suggest a string should be an FK
  const fkPatterns = [
    { pattern: /^(.+)Id$/, suggestion: (match: string) => `v.id("${match.toLowerCase()}s")` },
    { pattern: /^(.+)_id$/, suggestion: (match: string) => `v.id("${match.toLowerCase()}s")` },
    { pattern: /^userId$/, suggestion: () => 'v.id("admin_users")' },
    { pattern: /^ownerId$/, suggestion: () => 'v.id("admin_users")' },
    { pattern: /^createdBy$/, suggestion: () => 'v.id("admin_users")' },
    { pattern: /^deletedBy$/, suggestion: () => 'v.id("admin_users")' },
    { pattern: /^assignedTo$/, suggestion: () => 'v.id("admin_users")' },
    { pattern: /^accountId$/, suggestion: () => 'v.id("productivity_email_Accounts")' },
    { pattern: /^messageId$/, suggestion: () => 'v.id("productivity_email_Index")' },
    { pattern: /^projectId$/, suggestion: () => 'v.id("projects_tracking_Schedule")' },
  ];

  // Known exceptions - strings that look like IDs but aren't FKs
  const exceptions = new Set([
    // External provider IDs (not Convex references)
    'externalId',
    'externalMessageId',
    'externalThreadId',
    'externalFolderId',
    'providerFolderId',  // External folder ID from Outlook/Gmail
    'parentFolderId',    // External parent folder ID
    'clerkId',
    'stripeCustomerId',
    'stripeSubscriptionId',
    'paypalSubscriptionId',
    'subscriptionId',    // Webhook subscription from Microsoft
    'gmailHistoryId',
    'outlookDeltaToken',
    'entityId',          // Inside promotedTo object
    // Intentionally string (references external message, not Convex doc)
    'messageId',         // In BodyCache - references external provider messageId
    // TODO items (documented for future conversion)
    'orgId',             // TODO: Convert when orgs domain implemented
  ]);

  for (const table of tables) {
    for (const field of table.fields) {
      // Skip if already an FK
      if (field.isId) continue;

      // Skip known exceptions
      if (exceptions.has(field.name)) continue;

      // Skip if not a string type
      if (field.rawType !== 'string' &&
          !(field.rawType === 'optional' && field.name.endsWith('Id'))) continue;

      // Check against FK patterns
      for (const { pattern, suggestion } of fkPatterns) {
        const match = field.name.match(pattern);
        if (match) {
          result.suspects.push({
            table: table.name,
            field: field.name,
            line: field.line,
            suggestion: suggestion(match[1] || ''),
          });
          break; // Only one suggestion per field
        }
      }
    }
  }

  return result;
}

function printStringToFKResults(result: StringToFKResult) {
  console.log('\n' + '═'.repeat(70));
  console.log('  PHASE 4: STRING-TO-FK DETECTION');
  console.log('═'.repeat(70));

  if (result.suspects.length === 0) {
    console.log('\n  ✅ No string fields detected that should be FKs!\n');
    return;
  }

  console.log(`
  Found ${result.suspects.length} string fields that might be foreign keys:
  (These are v.string() but look like they reference other tables)
`);

  // Group by table
  const byTable = new Map<string, typeof result.suspects>();
  for (const suspect of result.suspects) {
    const existing = byTable.get(suspect.table) || [];
    existing.push(suspect);
    byTable.set(suspect.table, existing);
  }

  for (const [tableName, suspects] of byTable) {
    console.log(`  📋 ${tableName}:`);
    for (const s of suspects) {
      console.log(`     🔗 ${s.field} (line ${s.line})`);
      console.log(`        → Consider: ${s.suggestion}`);
    }
    console.log();
  }

  if (isNukeMode) {
    console.log('  💡 POST-NUKE TIP: Now is the time to convert these to proper FKs!');
    console.log('     Change v.string() to v.id("table_name") for referential integrity.\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

// Run all phases
const tables = parseSchema();

// Phase 1: Field classification
const fieldResult = analyzeFields(tables);
printSummary(fieldResult);

// Phase 2: Timestamp consistency
const timestampResult = checkTimestampConsistency(tables);
printTimestampResults(timestampResult);

// Phase 3: Naming consistency
const namingResult = checkNamingConsistency(tables);
printNamingResults(namingResult);

// Phase 4: String-to-FK detection
const stringFKResult = checkStringToFK(tables);
printStringToFKResults(stringFKResult);
