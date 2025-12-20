/**
 * ESLint Rule: vrp/no-fuse-in-domains
 *
 * Enforces VRP Architecture: DOMAIN = Clean, FEATURE = Dirty
 *
 * BLOCKS in domain files (src/app/domains/**):
 *   - use*Data hooks (useAdminData, useFinancialData, etc.)
 *   - use*Sync hooks (useAdminSync, useSettingsSync, etc.)
 *   - useQuery, useMutation (Convex)
 *   - useConvexUser
 *
 * ALLOWS in domain files:
 *   - useSetPageHeader (UI hook)
 *   - usePageTiming (performance hook)
 *   - useFuse (ONLY in Router.tsx for navigation)
 *   - React built-ins (useState, useEffect, etc.)
 *
 * Ref: _sdk/08-architecture/DOMAIN-AND-FEATURES-SETUP.md
 *      _sdk/09-protocols/VRP-PROTOCOL.md
 */

module.exports = {
  rules: {
    'no-fuse-in-domains': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent FUSE state hooks and Convex calls in domain files',
          category: 'VRP Architecture',
          recommended: true,
        },
        messages: {
          forbiddenDataHook: 'DOMAIN VIOLATION: "{{hook}}" is a data hook and must be used in Feature layer, not Domain. Move this logic to a Feature component in src/features/.',
          forbiddenSyncHook: 'DOMAIN VIOLATION: "{{hook}}" is a sync hook (contains useQuery/Convex) and must be used in Feature layer or Provider, not Domain. Move this logic to a Feature component in src/features/.',
          forbiddenConvexHook: 'DOMAIN VIOLATION: "{{hook}}" is a Convex hook and violates SRB-4. Domains must read from FUSE only. Move this logic to a Feature component in src/features/.',
          forbiddenConvexUser: 'DOMAIN VIOLATION: "useConvexUser" calls Convex directly and violates SRB-4. Move this logic to a Feature component in src/features/.',
          useFuseNotInRouter: 'DOMAIN VIOLATION: "useFuse" is only allowed in Router.tsx for navigation. Domain views should not directly access FUSE - use a Feature wrapper instead.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();

        // Only check files in src/app/domains/
        if (!filename.includes('/src/app/domains/')) {
          return {};
        }

        // Extract just the filename for Router.tsx check
        const isRouterFile = filename.endsWith('/Router.tsx');

        return {
          CallExpression(node) {
            // Check if it's a hook call (function starting with "use")
            if (node.callee.type !== 'Identifier') return;
            if (!node.callee.name.startsWith('use')) return;

            const hookName = node.callee.name;

            // FORBIDDEN: use*Data hooks
            if (/^use\w+Data$/.test(hookName)) {
              context.report({
                node,
                messageId: 'forbiddenDataHook',
                data: { hook: hookName },
              });
              return;
            }

            // FORBIDDEN: use*Sync hooks
            if (/^use\w+Sync$/.test(hookName)) {
              context.report({
                node,
                messageId: 'forbiddenSyncHook',
                data: { hook: hookName },
              });
              return;
            }

            // FORBIDDEN: Convex hooks
            if (hookName === 'useQuery' || hookName === 'useMutation') {
              context.report({
                node,
                messageId: 'forbiddenConvexHook',
                data: { hook: hookName },
              });
              return;
            }

            // FORBIDDEN: useConvexUser
            if (hookName === 'useConvexUser') {
              context.report({
                node,
                messageId: 'forbiddenConvexUser',
              });
              return;
            }

            // SPECIAL CASE: useFuse only allowed in Router.tsx
            if (hookName === 'useFuse' && !isRouterFile) {
              context.report({
                node,
                messageId: 'useFuseNotInRouter',
              });
              return;
            }

            // ALLOWED hooks (no error):
            // - useSetPageHeader
            // - usePageTiming
            // - useState, useEffect, useCallback, etc. (React built-ins)
            // - useFuse in Router.tsx only
          },
        };
      },
    },
  },
};
