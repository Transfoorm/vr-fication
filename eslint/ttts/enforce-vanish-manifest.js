/**
 * TTTS Rule: enforce-vanish-manifest (VANISH CASCADE COVERAGE)
 *
 * Enforces that every table with v.id("admin_users") fields is registered
 * in the DELETION_MANIFEST (either cascade or preserve).
 *
 * THE LAW:
 *   Every user-linked table MUST have an explicit deletion strategy.
 *   Orphaned data is forbidden. Forgetting is not an option at scale.
 *
 * VIOLATION:
 *   // In schema.ts:
 *   invoices: defineTable({
 *     userId: v.id("admin_users"),  // Table not in manifest!
 *     amount: v.number(),
 *   })
 *
 * CORRECT:
 *   // In deletionManifest.ts:
 *   cascade: {
 *     invoices: {
 *       fields: { userId: 'delete' }
 *     }
 *   }
 *   // OR
 *   preserve: ['invoices']
 *
 * Ref: VANISH PROTOCOL 2.0, TTT-CERTIFIED
 */

const fs = require('fs');
const path = require('path');

module.exports = {
  rules: {
    'enforce-vanish-manifest': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Ensure tables with user references are in DELETION_MANIFEST',
          category: 'TTTS Vanish Protocol',
        },
        messages: {
          missingFromManifest: `⛔ VANISH PROTOCOL VIOLATION: Table "{{tableName}}" has user reference field "{{fieldName}}" but is NOT registered in DELETION_MANIFEST.

When users are deleted, data in this table will be ORPHANED.

FIX: Add to convex/vanish/deletionManifest.ts:

Option 1 - CASCADE (delete/anonymize user's records):
  cascade: {
    {{tableName}}: {
      fields: { {{fieldName}}: 'delete' }  // or 'anonymize' or 'preserve'
    }
  }

Option 2 - PRESERVE (never delete, e.g., audit logs):
  preserve: ['{{tableName}}']

Also add index to schema.ts:
  .index('by_user', ['{{fieldName}}'])

VANISH LAW: "Every user reference must have an explicit deletion strategy."`,

          missingIndex: `⚠️ VANISH WARNING: Table "{{tableName}}" needs an index for cascade queries.

Add to schema.ts after defineTable():
  .index('by_user', ['{{fieldName}}'])

Without this index, cascade deletion will be slow on large tables.`,
        },
      },

      create(context) {
        const filename = context.getFilename();

        // Only run on convex/schema.ts
        if (!filename.endsWith('convex/schema.ts') && !filename.includes('convex\\schema.ts')) {
          return {};
        }

        // Read the deletion manifest to get registered tables
        let manifestContent = '';
        try {
          const manifestPath = path.resolve(
            path.dirname(filename),
            'vanish/deletionManifest.ts'
          );
          manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        } catch (e) {
          // Manifest doesn't exist yet - that's okay for new projects
          return {};
        }

        // Parse manifest to extract cascade and preserve tables
        const cascadeTables = new Set();
        const preserveTables = new Set();

        // Extract cascade table names
        // Look for pattern: tableName: { (table definitions have opening brace)
        // But NOT: fields: {, batchSize:, indexName: (config properties)
        const configKeys = ['fields', 'batchSize', 'indexName', 'cascade', 'preserve', 'storageFields'];
        const tablePattern = /^\s*(\w+)\s*:\s*\{/gm;
        let match;
        while ((match = tablePattern.exec(manifestContent)) !== null) {
          const tableName = match[1];
          if (tableName && !configKeys.includes(tableName)) {
            cascadeTables.add(tableName);
          }
        }

        // Extract preserve array
        const preserveMatch = manifestContent.match(/preserve:\s*\[([\s\S]*?)\]/);
        if (preserveMatch) {
          const preserveBlock = preserveMatch[1];
          const tableMatches = preserveBlock.match(/['"](\w+)['"]/g);
          if (tableMatches) {
            tableMatches.forEach(m => {
              preserveTables.add(m.replace(/['"]/g, ''));
            });
          }
        }

        // Track tables and their user fields found in this file
        const tablesWithUserFields = new Map(); // tableName -> [fieldNames]
        const tablesWithIndexes = new Map(); // tableName -> [indexedFields]
        let currentTableName = null;

        return {
          // Track which table we're currently in
          'CallExpression[callee.name="defineTable"]'(node) {
            // Find the property assignment this defineTable is part of
            let parent = node.parent;
            while (parent) {
              if (parent.type === 'Property' && parent.key && parent.key.name) {
                currentTableName = parent.key.name;
                break;
              }
              parent = parent.parent;
            }
          },

          // Look for v.id("admin_users") calls
          'CallExpression[callee.property.name="id"]'(node) {
            // Check if argument is "admin_users"
            if (
              node.arguments.length > 0 &&
              node.arguments[0].type === 'Literal' &&
              node.arguments[0].value === 'admin_users'
            ) {
              // Find which field this is in
              let fieldName = null;
              let parent = node.parent;

              // Walk up to find the Property node
              while (parent) {
                if (parent.type === 'Property' && parent.key && parent.key.name) {
                  fieldName = parent.key.name;
                  break;
                }
                parent = parent.parent;
              }

              // Find the table name by walking further up
              let tableName = null;
              parent = node.parent;
              while (parent) {
                if (
                  parent.type === 'Property' &&
                  parent.value &&
                  parent.value.type === 'CallExpression'
                ) {
                  // Check if this is a defineTable call or chained from one
                  let checkNode = parent.value;
                  while (checkNode) {
                    if (
                      checkNode.type === 'CallExpression' &&
                      checkNode.callee &&
                      checkNode.callee.name === 'defineTable'
                    ) {
                      tableName = parent.key.name;
                      break;
                    }
                    // Check for chained calls like defineTable().index()
                    if (
                      checkNode.type === 'CallExpression' &&
                      checkNode.callee &&
                      checkNode.callee.type === 'MemberExpression'
                    ) {
                      checkNode = checkNode.callee.object;
                    } else {
                      break;
                    }
                  }
                  if (tableName) break;
                }
                parent = parent.parent;
              }

              if (tableName && fieldName) {
                // Skip the admin_users table itself
                if (tableName === 'admin_users') return;

                if (!tablesWithUserFields.has(tableName)) {
                  tablesWithUserFields.set(tableName, []);
                }
                tablesWithUserFields.get(tableName).push({ fieldName, node });
              }
            }
          },

          // Track .index() calls
          'CallExpression[callee.property.name="index"]'(node) {
            // Get index name and fields
            if (node.arguments.length >= 2) {
              const indexName = node.arguments[0];
              const fieldsArg = node.arguments[1];

              if (
                indexName.type === 'Literal' &&
                fieldsArg.type === 'ArrayExpression'
              ) {
                const fields = fieldsArg.elements
                  .filter(el => el && el.type === 'Literal')
                  .map(el => el.value);

                // Find which table this index belongs to
                let tableName = null;
                let parent = node.parent;
                while (parent) {
                  if (parent.type === 'Property' && parent.key && parent.key.name) {
                    tableName = parent.key.name;
                    break;
                  }
                  parent = parent.parent;
                }

                if (tableName) {
                  if (!tablesWithIndexes.has(tableName)) {
                    tablesWithIndexes.set(tableName, []);
                  }
                  tablesWithIndexes.get(tableName).push(...fields);
                }
              }
            }
          },

          // At the end of the file, check all tables
          'Program:exit'() {
            for (const [tableName, fields] of tablesWithUserFields) {
              // Check if table is registered in manifest
              const isInCascade = cascadeTables.has(tableName);
              const isInPreserve = preserveTables.has(tableName);

              if (!isInCascade && !isInPreserve) {
                // Report error for each unregistered field
                for (const { fieldName, node } of fields) {
                  context.report({
                    node,
                    messageId: 'missingFromManifest',
                    data: { tableName, fieldName },
                  });
                }
              }
            }
          },
        };
      },
    },
  },
};
