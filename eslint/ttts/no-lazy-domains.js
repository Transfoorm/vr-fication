/**
 * TTTS-6: No Lazy Domain Loading Rule
 *
 * Blocks lazy loading patterns in domain views:
 * - dynamic() from next/dynamic
 * - React.lazy()
 * - lazy() imports
 *
 * FUSE Strategy 1 requires entire domains to be preloaded.
 * Lazy loading defeats ADP/WARP/PRISM predictive delivery.
 *
 * ⛔ TTTS ADP VIOLATION:
 * Lazy-loading domains violates ADP Predictive Delivery.
 * Entire domain MUST preload on dropdown intent.
 */

module.exports = {
  rules: {
    'no-lazy-domains': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow lazy loading in domain views (TTTS-6)',
          category: 'TTTS Enforcement',
        },
        messages: {
          noDynamic: '⛔ TTTS-6 VIOLATION: dynamic() imports are forbidden in domain views. FUSE Strategy 1 requires full domain preload via WARP/PRISM. Remove dynamic() and import directly.',
          noReactLazy: '⛔ TTTS-6 VIOLATION: React.lazy() is forbidden in domain views. FUSE Strategy 1 requires full domain preload via WARP/PRISM. Remove lazy() and import directly.',
          noLazyImport: '⛔ TTTS-6 VIOLATION: lazy() imports are forbidden in domain views. FUSE Strategy 1 requires full domain preload via WARP/PRISM. Import directly.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();

        // Only enforce in domain views
        const isDomainView =
          filename.includes('/app/domains/') ||
          filename.includes('/domains/') ||
          filename.includes('/views/');

        if (!isDomainView) {
          return {};
        }

        return {
          // Catch: import dynamic from 'next/dynamic' + dynamic(...)
          CallExpression(node) {
            // Check for dynamic() call
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'dynamic'
            ) {
              context.report({
                node,
                messageId: 'noDynamic',
              });
            }

            // Check for React.lazy() call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'React' &&
              node.callee.property.name === 'lazy'
            ) {
              context.report({
                node,
                messageId: 'noReactLazy',
              });
            }

            // Check for standalone lazy() call
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'lazy'
            ) {
              context.report({
                node,
                messageId: 'noLazyImport',
              });
            }
          },

          // Catch: import { lazy } from 'react'
          ImportSpecifier(node) {
            if (
              node.imported.name === 'lazy' &&
              node.parent.source.value === 'react'
            ) {
              context.report({
                node,
                messageId: 'noLazyImport',
              });
            }
          },

          // Catch: import dynamic from 'next/dynamic'
          ImportDefaultSpecifier(node) {
            if (
              node.local.name === 'dynamic' &&
              node.parent.source.value === 'next/dynamic'
            ) {
              context.report({
                node,
                messageId: 'noDynamic',
              });
            }
          },
        };
      },
    },
  },
};
