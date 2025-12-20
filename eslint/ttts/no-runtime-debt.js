/**
 * TTTS-7: No Render-Time Mutation Rule
 *
 * Blocks patterns that create runtime debt:
 * - useEffect with fetch/query inside
 * - async functions in useEffect
 * - data fetching patterns in render cycle
 *
 * FUSE Strategy 1 requires ALL data to be preloaded via WARP/PRISM.
 * Runtime fetching defeats predictive delivery and creates loading states.
 *
 * ⛔ TTTS RUNTIME DEBT:
 * Render-time logic increases runtime cost at scale.
 * Move ALL logic to build or preload stage.
 */

module.exports = {
  rules: {
    'no-runtime-debt': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow render-time data fetching and mutations (TTTS-7)',
          category: 'TTTS Enforcement',
        },
        messages: {
          noUseEffectFetch: '⛔ TTTS-7 VIOLATION: useEffect with fetch/query detected. Data must be preloaded via WARP/PRISM, not fetched at render time. Move to server-side preloading.',
          noAsyncUseEffect: '⛔ TTTS-7 VIOLATION: async function in useEffect creates runtime debt. Data must be preloaded via WARP/PRISM before render.',
          noUseQueryInComponent: '⛔ TTTS-7 VIOLATION: useQuery in component creates render-time fetching. Use useFuse() to read preloaded data from WARP.',
          noFetchInUseEffect: '⛔ TTTS-7 VIOLATION: fetch() in useEffect violates Golden Bridge. All data comes from WARP → Cookie → FUSE Store.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename();

        // Skip API routes, scripts, and server-only files
        if (
          filename.includes('/api/') ||
          filename.includes('/scripts/') ||
          filename.includes('.server.')
        ) {
          return {};
        }

        // Track if we're inside a useEffect callback
        let useEffectDepth = 0;

        return {
          // Detect useEffect calls
          CallExpression(node) {
            // Check if this is useEffect
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'useEffect'
            ) {
              const callback = node.arguments[0];

              // Check for async callback - immediate TTTS-7 violation
              if (callback && callback.async) {
                context.report({
                  node: callback,
                  messageId: 'noAsyncUseEffect',
                });
              }
            }

            // Check for useQuery (Convex pattern) - violates Golden Bridge
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'useQuery'
            ) {
              context.report({
                node,
                messageId: 'noUseQueryInComponent',
              });
            }

            // Check for fetch inside useEffect
            if (
              useEffectDepth > 0 &&
              node.callee.type === 'Identifier' &&
              node.callee.name === 'fetch'
            ) {
              context.report({
                node,
                messageId: 'noFetchInUseEffect',
              });
            }
          },

          // Track entering useEffect callback
          'CallExpression[callee.name="useEffect"] > ArrowFunctionExpression': function() {
            useEffectDepth++;
          },
          'CallExpression[callee.name="useEffect"] > ArrowFunctionExpression:exit': function() {
            useEffectDepth--;
          },
          'CallExpression[callee.name="useEffect"] > FunctionExpression': function() {
            useEffectDepth++;
          },
          'CallExpression[callee.name="useEffect"] > FunctionExpression:exit': function() {
            useEffectDepth--;
          },

          // Check for await inside useEffect (via IIFE pattern)
          AwaitExpression(node) {
            if (useEffectDepth > 0) {
              // Check if awaiting a fetch
              if (
                node.argument.type === 'CallExpression' &&
                node.argument.callee.type === 'Identifier' &&
                node.argument.callee.name === 'fetch'
              ) {
                context.report({
                  node,
                  messageId: 'noFetchInUseEffect',
                });
              }
            }
          },
        };
      },
    },
  },
};
