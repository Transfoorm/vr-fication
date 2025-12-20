/**
 * TTTS Rule: enforce-slice-shape
 *
 * Enforces that every domain slice matches FUSE/ADP/PRISM contract.
 *
 * Required slice structure:
 * {
 *   // Domain data
 *   data: { ... },
 *
 *   // Coordination fields (REQUIRED for PRISM) - TTTS-1 COMPLIANT
 *   status: 'idle' | 'loading' | 'hydrated' | 'error',
 *   lastFetchedAt: number | undefined,
 *   source: 'SSR' | 'WARP' | 'CONVEX_LIVE' | 'MUTATION' | 'ROLLBACK' | undefined,
 *
 *   // Hydration function (REQUIRED for WARP)
 *   hydrateDomain: (data, source) => void,
 * }
 *
 * This enables:
 *   - WARP freshness checks (lastFetchedAt)
 *   - Debugging (source tracking)
 *   - Coordination (status prevents duplicate fetches)
 *   - TTL revalidation (5 min freshness window)
 *
 * Ref: TTTS-ENFORCEMENT-PACK-(v1.0).md, 04-ADP-PATTERN.md
 */

module.exports = {
  rules: {
    'enforce-slice-shape': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce FUSE/ADP slice shape in domain store files',
          category: 'TTTS Slice Discipline',
        },
        messages: {
          missingField: `⛔ TTTS-1 SLICE VIOLATION: Domain slice is missing required field '{{field}}'.

Every domain slice MUST have (TTTS-1 COMPLIANT):
  ✓ status: 'idle' | 'loading' | 'hydrated' | 'error'
  ✓ lastFetchedAt: number | undefined
  ✓ source: 'SSR' | 'WARP' | 'CONVEX_LIVE' | 'MUTATION' | 'ROLLBACK' | undefined

NOTE: status === 'hydrated' is THE ONE source of truth for data readiness.
      NO isXHydrated booleans. NO 'ready' status.

These enable:
  • WARP freshness checks (prevents duplicate fetches)
  • TTL revalidation (5 min freshness window)
  • Debugging (know where data came from)
  • PRISM coordination (status prevents race conditions)

See: 04-ADP-PATTERN.md, TTTS-ENFORCEMENT-PACK-(v1.0).md`,

          missingHydrator: `⛔ TTTS SLICE VIOLATION: Domain slice is missing hydration function.

Every domain slice MUST export a hydration function:
  hydrate{{Domain}}: (data: Partial<{{Domain}}Slice>, source?: SourceType) => void

This function is called by:
  • WARP orchestrator (after preload)
  • PRISM triggers (on intent)
  • Convex auto-sync (real-time updates)
  • Optimistic updates (mutations)

Without it, ADP pattern cannot function.

See: 04-ADP-PATTERN.md, TTTS-ENFORCEMENT-PACK-(v1.0).md`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only enforce in slice/store files
        const slicePatterns = [
          /\/fuse\/store\/.*\.ts$/,
          /\/store\/slices\/.*\.ts$/,
          /\/store\/.*Slice\.ts$/,
          /\/fuse\/domains\/.*\.ts$/,
        ];

        const isSliceFile = slicePatterns.some(pattern => pattern.test(filename));
        if (!isSliceFile) {
          return {};
        }

        // Skip index files and type files
        if (filename.includes('index.ts') || filename.includes('types.ts')) {
          return {};
        }

        // Required fields for PRISM/WARP coordination
        const requiredFields = ['status', 'lastFetchedAt', 'source'];

        // Track what we find
        let foundFields = new Set();
        let foundHydrator = false;
        let hasSliceDefinition = false;

        return {
          // Check object expressions for slice shape
          ObjectExpression(node) {
            // Look for objects that define slice state
            const properties = node.properties || [];
            const propertyNames = properties
              .filter(p => p.key && p.key.name)
              .map(p => p.key.name);

            // If this looks like a slice definition (has common slice fields)
            const sliceIndicators = ['status', 'data', 'lastFetchedAt', 'source'];
            const hasSliceIndicator = sliceIndicators.some(ind =>
              propertyNames.includes(ind)
            );

            if (hasSliceIndicator) {
              hasSliceDefinition = true;
              propertyNames.forEach(name => foundFields.add(name));
            }
          },

          // Check for hydration function
          Property(node) {
            if (node.key && node.key.name) {
              const name = node.key.name;

              // Check for hydrate* function
              if (name.startsWith('hydrate') && node.value.type === 'ArrowFunctionExpression') {
                foundHydrator = true;
              }

              // Also track fields
              if (requiredFields.includes(name)) {
                foundFields.add(name);
              }
            }
          },

          // Check function declarations for hydrators
          FunctionDeclaration(node) {
            if (node.id && node.id.name && node.id.name.startsWith('hydrate')) {
              foundHydrator = true;
            }
          },

          // Check variable declarations for hydrators
          VariableDeclarator(node) {
            if (node.id && node.id.name && node.id.name.startsWith('hydrate')) {
              foundHydrator = true;
            }
          },

          // Report at end of file
          'Program:exit'(node) {
            // Only report if this looks like a slice file with definitions
            if (!hasSliceDefinition) {
              return;
            }

            // Check for missing required fields
            for (const field of requiredFields) {
              if (!foundFields.has(field)) {
                context.report({
                  node,
                  messageId: 'missingField',
                  data: { field },
                });
              }
            }

            // Check for missing hydrator
            if (!foundHydrator) {
              // Extract domain name from filename
              const domainMatch = filename.match(/(\w+)(?:Slice)?\.ts$/);
              const domain = domainMatch ? domainMatch[1] : 'Domain';

              context.report({
                node,
                messageId: 'missingHydrator',
                data: {
                  Domain: domain.charAt(0).toUpperCase() + domain.slice(1),
                },
              });
            }
          },
        };
      },
    },
  },
};
