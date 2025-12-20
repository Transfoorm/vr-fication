/**─────────────────────────────────────────────────────────────────────────┐
│  🔍 VANISH PROTOCOL 2.0 - CASCADE COVERAGE VERIFIER                       │
│  /convex/scripts/verifyCascadeCoverage.ts                                 │
│                                                                           │
│  AST-based build-time enforcement for deletion manifest compliance.       │
│                                                                           │
│  VERIFIES:                                                                │
│  1. Every table with userId fields is registered in DELETION_MANIFEST     │
│  2. Every user-linked field has an explicit deletion strategy             │
│  3. Every user-linked field has a corresponding .index('by_user', [field])│
│  4. Multi-ref tables (multiple user fields) have strategies for each      │
│                                                                           │
│  USAGE:                                                                   │
│  npm run verify:cascade  (in package.json scripts)                        │
│  Runs in CI/CD pipeline - fails build if violations detected              │
│                                                                           │
│  TTT CERTIFIED: Makes forgetting impossible at 1K developer scale         │
└───────────────────────────────────────────────────────────────────────────┘ */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { DELETION_MANIFEST } from '@/convex/vanish/deletionManifest';

/**
 * Parsed table information from schema
 */
interface TableInfo {
  name: string;
  userFields: UserFieldInfo[];
  storageFields: StorageFieldInfo[];
  indexes: IndexInfo[];
}

interface UserFieldInfo {
  fieldName: string;
  isOptional: boolean;
}

interface StorageFieldInfo {
  fieldName: string;
  isOptional: boolean;
}

interface IndexInfo {
  name: string;
  fields: string[];
}

/**
 * Verification result
 */
interface VerificationResult {
  success: boolean;
  unregisteredTables: string[];
  missingStrategies: Array<{ table: string; field: string }>;
  missingIndexes: Array<{ table: string; field: string }>;
  missingStorageFields: Array<{ table: string; field: string }>;
  multiRefTables: Array<{ table: string; fields: string[] }>;
  errors: string[];
}

/**
 * Parse schema.ts file using TypeScript AST
 */
function parseSchema(schemaPath: string): TableInfo[] {
  const sourceCode = fs.readFileSync(schemaPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    'schema.ts',
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const tables: TableInfo[] = [];

  function visit(node: ts.Node) {
    // Look for: tableName: defineTable({ ... })
    if (
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      ts.isCallExpression(node.initializer)
    ) {
      const tableName = node.name.text;
      const callExpr = node.initializer;

      // Check if it's a defineTable call
      if (
        ts.isIdentifier(callExpr.expression) &&
        callExpr.expression.text === 'defineTable'
      ) {
        const tableInfo = parseTableDefinition(tableName, callExpr);
        if (tableInfo.userFields.length > 0 || tableInfo.storageFields.length > 0 || tableInfo.indexes.length > 0) {
          tables.push(tableInfo);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return tables;
}

/**
 * Parse a defineTable call to extract user fields, storage fields, and indexes
 */
function parseTableDefinition(
  tableName: string,
  callExpr: ts.CallExpression
): TableInfo {
  const userFields: UserFieldInfo[] = [];
  const storageFields: StorageFieldInfo[] = [];
  const indexes: IndexInfo[] = [];

  // Parse table schema (first argument to defineTable)
  if (callExpr.arguments.length > 0) {
    const schemaArg = callExpr.arguments[0];
    if (ts.isObjectLiteralExpression(schemaArg)) {
      schemaArg.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const fieldName = prop.name.text;
          const fieldInfo = parseFieldType(prop.initializer);

          if (fieldInfo.isUserReference) {
            userFields.push({
              fieldName,
              isOptional: fieldInfo.isOptional
            });
          }

          // Check if field name suggests it stores file references
          if (isStorageFieldName(fieldName)) {
            storageFields.push({
              fieldName,
              isOptional: fieldInfo.isOptional
            });
          }
        }
      });
    }
  }

  // Parse index definitions (chained .index() calls)
  let currentExpr: ts.Expression = callExpr;
  while (ts.isCallExpression(currentExpr)) {
    if (
      ts.isPropertyAccessExpression(currentExpr.expression) &&
      ts.isIdentifier(currentExpr.expression.name) &&
      currentExpr.expression.name.text === 'index'
    ) {
      const indexInfo = parseIndexDefinition(currentExpr);
      if (indexInfo) {
        indexes.push(indexInfo);
      }
      currentExpr = currentExpr.expression.expression;
    } else {
      break;
    }
  }

  return { name: tableName, userFields, storageFields, indexes };
}

/**
 * Check if field name suggests it stores file/storage references
 * Looks for common patterns: avatarUrl, logoUrl, fileId, attachments, etc.
 */
function isStorageFieldName(fieldName: string): boolean {
  const storagePatterns = [
    /url$/i,           // ends with "Url" (avatarUrl, brandLogoUrl, imageUrl)
    /^avatar/i,        // starts with "avatar"
    /^logo/i,          // starts with "logo"
    /^image/i,         // starts with "image"
    /file/i,           // contains "file" (fileId, fileIds, uploadedFile)
    /attachment/i,     // contains "attachment"
    /photo/i,          // contains "photo"
    /thumbnail/i,      // contains "thumbnail"
  ];

  return storagePatterns.some(pattern => pattern.test(fieldName));
}

/**
 * Parse field type to check if it references v.id("users")
 */
function parseFieldType(
  typeExpr: ts.Expression
): { isUserReference: boolean; isOptional: boolean } {
  let isUserReference = false;
  let isOptional = false;

  function checkExpression(expr: ts.Expression): void {
    // Check for v.id("users")
    if (ts.isCallExpression(expr)) {
      if (
        ts.isPropertyAccessExpression(expr.expression) &&
        ts.isIdentifier(expr.expression.name) &&
        expr.expression.name.text === 'id'
      ) {
        // Check if argument is "users"
        if (
          expr.arguments.length > 0 &&
          ts.isStringLiteral(expr.arguments[0]) &&
          expr.arguments[0].text === 'users'
        ) {
          isUserReference = true;
        }
      }

      // Check for v.optional(...)
      if (
        ts.isPropertyAccessExpression(expr.expression) &&
        ts.isIdentifier(expr.expression.name) &&
        expr.expression.name.text === 'optional'
      ) {
        isOptional = true;
        if (expr.arguments.length > 0) {
          checkExpression(expr.arguments[0]);
        }
      }
    }
  }

  checkExpression(typeExpr);
  return { isUserReference, isOptional };
}

/**
 * Parse .index() call to extract index information
 */
function parseIndexDefinition(callExpr: ts.CallExpression): IndexInfo | null {
  if (callExpr.arguments.length < 2) return null;

  const nameArg = callExpr.arguments[0];
  const fieldsArg = callExpr.arguments[1];

  if (!ts.isStringLiteral(nameArg)) return null;

  const indexName = nameArg.text;
  const fields: string[] = [];

  // Parse fields array
  if (ts.isArrayLiteralExpression(fieldsArg)) {
    fieldsArg.elements.forEach((elem) => {
      if (ts.isStringLiteral(elem)) {
        fields.push(elem.text);
      }
    });
  }

  return { name: indexName, fields };
}

/**
 * Verify deletion manifest coverage
 */
function verifyCoverage(tables: TableInfo[]): VerificationResult {
  const result: VerificationResult = {
    success: true,
    unregisteredTables: [],
    missingStrategies: [],
    missingIndexes: [],
    missingStorageFields: [],
    multiRefTables: [],
    errors: []
  };

  const registeredTables = new Set([
    ...Object.keys(DELETION_MANIFEST.cascade),
    ...DELETION_MANIFEST.preserve
  ]);

  for (const table of tables) {
    // Skip the users table itself
    if (table.name === 'users') continue;

    // Check if table has user references but isn't registered
    if (table.userFields.length > 0 && !registeredTables.has(table.name)) {
      result.unregisteredTables.push(table.name);
      result.success = false;
    }

    // Check for multi-ref tables
    if (table.userFields.length > 1) {
      result.multiRefTables.push({
        table: table.name,
        fields: table.userFields.map((f) => f.fieldName)
      });
    }

    // Check each user field has a strategy
    for (const userField of table.userFields) {
      const config = DELETION_MANIFEST.cascade[table.name];
      if (config) {
        const strategy = config.fields[userField.fieldName];
        if (!strategy) {
          result.missingStrategies.push({
            table: table.name,
            field: userField.fieldName
          });
          result.success = false;
        }
      }

      // Check for corresponding index
      const indexName = DELETION_MANIFEST.cascade[table.name]?.indexName ?? 'by_user';
      const hasIndex = table.indexes.some(
        (idx) =>
          idx.name === indexName &&
          idx.fields.includes(userField.fieldName)
      );

      if (!hasIndex && table.userFields.length > 0) {
        result.missingIndexes.push({
          table: table.name,
          field: userField.fieldName
        });
        result.success = false;
      }
    }

    // Check storage fields are registered in manifest
    for (const storageField of table.storageFields) {
      const registeredFields = DELETION_MANIFEST.storageFields[table.name] ?? [];

      if (!registeredFields.includes(storageField.fieldName)) {
        result.missingStorageFields.push({
          table: table.name,
          field: storageField.fieldName
        });
        result.success = false;
      }
    }
  }

  return result;
}

/**
 * Format and display verification results
 */
function displayResults(result: VerificationResult): void {
  const cascadeTables = Object.keys(DELETION_MANIFEST.cascade).length;
  const preservedTables = DELETION_MANIFEST.preserve.length;

  if (result.success) {
    console.log(`✓ Vanish cascade coverage (${cascadeTables} tables, ${preservedTables} preserved)`);
    return;
  }

  console.error('\n✗ Vanish: Deletion manifest incomplete\n');

  if (result.unregisteredTables.length > 0) {
    console.log('❌ UNREGISTERED TABLES:');
    console.log('   The following tables have userId fields but are not in DELETION_MANIFEST:\n');
    result.unregisteredTables.forEach((table) => {
      console.log(`   • ${table}`);
    });
    console.log('\n   ➜ Add to convex/deletionManifest.ts cascade or preserve array\n');
  }

  if (result.missingStrategies.length > 0) {
    console.log('❌ MISSING FIELD STRATEGIES:');
    console.log('   The following fields need explicit deletion strategies:\n');
    result.missingStrategies.forEach(({ table, field }) => {
      console.log(`   • ${table}.${field}`);
    });
    console.log('\n   ➜ Add strategy to DELETION_MANIFEST.cascade[table].fields[field]\n');
  }

  if (result.missingIndexes.length > 0) {
    console.log('❌ MISSING INDEXES:');
    console.log('   The following fields need .index() definitions for cascade queries:\n');
    result.missingIndexes.forEach(({ table, field }) => {
      console.log(`   • ${table}.${field} → .index('by_user', ['${field}'])`);
    });
    console.log('\n   ➜ Add .index() to table definition in schema.ts\n');
  }

  if (result.missingStorageFields.length > 0) {
    console.log('❌ MISSING STORAGE FIELDS:');
    console.log('   The following storage/file fields are not registered for cleanup:\n');
    result.missingStorageFields.forEach(({ table, field }) => {
      console.log(`   • ${table}.${field}`);
    });
    console.log('\n   ➜ Add to DELETION_MANIFEST.storageFields in deletionManifest.ts');
    console.log('   ➜ Format: storageFields: { tableName: [\'field1\', \'field2\'] }\n');
    console.log('   ⚠️  WITHOUT THIS: Orphaned files will remain in Convex storage after user deletion!\n');
  }

  if (result.multiRefTables.length > 0) {
    console.log('⚠️  MULTI-REFERENCE TABLES:');
    console.log('   These tables have multiple user fields - ensure each has a strategy:\n');
    result.multiRefTables.forEach((t) => {
      console.log(`   • ${t.table}: ${t.fields.join(', ')}`);
    });
    console.log('');
  }

  console.log('═════════════════════════════════════════════════════════════════\n');
  console.log('🔒 VANISH LAW:');
  console.log('   "Every user reference must have an explicit deletion strategy."');
  console.log('   "Forgetting is not an option at scale."\n');
}

/**
 * Main verification function
 */
export function runVerification(): void {
  try {
    const schemaPath = path.join(process.cwd(), 'convex/schema.ts');

    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Schema file not found: ${schemaPath}`);
      process.exit(1);
    }

    const tables = parseSchema(schemaPath);

    const result = verifyCoverage(tables);
    displayResults(result);

    if (!result.success) {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Verification failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run verification if called directly
if (require.main === module) {
  runVerification();
}
