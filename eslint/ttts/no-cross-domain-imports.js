/**
 * TTTS Rule: no-cross-domain-imports
 *
 * Enforces domain sovereignty - domains must remain isolated islands.
 * No domain may import from another domain.
 *
 * VIOLATION:
 *   // In src/app/domains/clients/People.tsx
 *   import { something } from '@/app/domains/finance/utils';
 *
 * CORRECT:
 *   - Shared logic goes in @/fuse/, @/lib/, @/utils/
 *   - Domain-specific logic stays in its domain
 *   - Cross-domain data flows through FUSE store only
 *
 * Domain boundaries (Sovereign Router):
 *   - clients/
 *   - finance/
 *   - productivity/
 *   - projects/
 *   - settings/
 *   - admin/
 *   - system/
 *
 * Ref: TTTS-ENFORCEMENT-PACK-(v1.0).md, TTTS-5
 */

module.exports = {
  rules: {
    'no-cross-domain-imports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow imports between domain boundaries',
          category: 'TTTS Domain Sovereignty',
        },
        messages: {
          crossDomainImport: `⛔ TTTS DOMAIN BOUNDARY VIOLATION: Cross-domain import detected.

Domains MUST remain sovereign islands:
  ❌ clients → finance
  ❌ finance → admin
  ❌ productivity → projects

If you need shared logic:
  1. Move to @/fuse/ (store, hooks, hydration)
  2. Move to @/lib/ (utilities)
  3. Move to @/utils/ (helpers)
  4. Move to @/prebuilts/ (UI components)

Cross-domain DATA flows through FUSE store only:
  - Domain A writes to FUSE
  - Domain B reads from FUSE
  - Never direct imports

Importing from: {{importPath}}
Current domain: {{currentDomain}}

See: TTTS-ENFORCEMENT-PACK-(v1.0).md`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Define domain boundaries (Sovereign Router structure)
        const domains = [
          'clients',
          'finance',
          'productivity',
          'projects',
          'settings',
          'admin',
          'system',
        ];

        // Extract current domain from filename
        const getCurrentDomain = (filepath) => {
          for (const domain of domains) {
            // Match patterns like /app/domains/clients/ (Sovereign Router)
            const patterns = [
              new RegExp(`/app/domains/${domain}/`),
              new RegExp(`/domains/${domain}/`),
            ];

            if (patterns.some(p => p.test(filepath))) {
              return domain;
            }
          }
          return null;
        };

        // Extract target domain from import path
        const getTargetDomain = (importPath) => {
          for (const domain of domains) {
            const patterns = [
              new RegExp(`@/app/\\(modes\\)/${domain}`),
              new RegExp(`@/app/\\(modes\\)/\\(shared\\)/${domain}`),
              new RegExp(`@/domains/${domain}`),
              new RegExp(`@/app/${domain}`),
              // Relative imports that reference domain folders
              new RegExp(`\\.\\./.*${domain}/`),
              new RegExp(`\\.\\./${domain}/`),
            ];

            if (patterns.some(p => p.test(importPath))) {
              return domain;
            }
          }
          return null;
        };

        const currentDomain = getCurrentDomain(filename);

        // If not in a domain folder, don't enforce
        if (!currentDomain) {
          return {};
        }

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            const targetDomain = getTargetDomain(importPath);

            // If importing from another domain, report violation
            if (targetDomain && targetDomain !== currentDomain) {
              context.report({
                node,
                messageId: 'crossDomainImport',
                data: {
                  importPath,
                  currentDomain,
                },
              });
            }
          },

          // Also catch dynamic imports
          CallExpression(node) {
            if (
              node.callee.type === 'Import' ||
              (node.callee.name === 'require')
            ) {
              const arg = node.arguments[0];
              if (arg && arg.type === 'Literal' && typeof arg.value === 'string') {
                const importPath = arg.value;
                const targetDomain = getTargetDomain(importPath);

                if (targetDomain && targetDomain !== currentDomain) {
                  context.report({
                    node,
                    messageId: 'crossDomainImport',
                    data: {
                      importPath,
                      currentDomain,
                    },
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
