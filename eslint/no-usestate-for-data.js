// Custom ESLint rule: no-usestate-for-data
// Prevents useState for server data - enforces FUSE Store + WARP pattern
// Ref: 01-FUSE-CORE-ARCHITECTURE.md

module.exports = {
  rules: {
    'no-usestate-for-data': {
      create(context) {
        return {
          CallExpression(node) {
            // Detect useState calls
            if (
              node.callee.name === 'useState' &&
              node.arguments.length > 0
            ) {
              const initialValue = node.arguments[0];

              // Check for array/object initial values (likely data)
              const isDataStructure =
                initialValue.type === 'ArrayExpression' ||
                (initialValue.type === 'ObjectExpression' && initialValue.properties.length > 0) ||
                (initialValue.type === 'Literal' && initialValue.value === null);

              if (isDataStructure) {
                // Get variable name from destructuring
                const parent = node.parent;
                if (parent && parent.type === 'VariableDeclarator' && parent.id.type === 'ArrayPattern') {
                  const varName = parent.id.elements[0]?.name || '';

                  // Common data variable names
                  const dataVarPatterns = /^(users|clients|projects|finances|work|data|items|list|records|entities|admin|settings)/i;

                  if (dataVarPatterns.test(varName)) {
                    context.report({
                      node,
                      message: `⛔ FUSE VIOLATION: Server data belongs in FUSE Store via WARP preloading, not local useState. Variable "${varName}" looks like server data. Use domain providers (DashboardProvider, ClientsProvider, etc.) + useFuse() instead. Ref: 01-FUSE-CORE-ARCHITECTURE.md, 07-GREAT-PROVIDER-ECOSYSTEM.md`,
                    });
                  }
                }
              }
            }
          }
        };
      }
    }
  }
};
