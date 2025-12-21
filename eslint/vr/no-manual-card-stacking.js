/**
 * ESLint Rule: no-manual-card-stacking
 *
 * Enforces Stack VR usage when multiple Card.standard components are siblings.
 *
 * ❌ VIOLATION:
 * <div className="ft-something">
 *   <Card.standard>...</Card.standard>
 *   <Card.standard>...</Card.standard>
 * </div>
 *
 * ✅ CORRECT:
 * <Stack>
 *   <Card.standard>...</Card.standard>
 *   <Card.standard>...</Card.standard>
 * </Stack>
 *
 * TTT Justification:
 * - Architecture Test: VR modularity > manual CSS
 * - Simplicity Test: One import vs duplicate CSS
 * - Consistency Test: Same spacing across app
 * - Doctrine Test: "There's a VR for that"
 */

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce Stack VR when multiple Card.standard components are siblings',
      category: 'VRP - VR Doctrine',
      recommended: true,
    },
    messages: {
      useStackVR: '⛔ VR VIOLATION: Multiple Card.standard siblings must be wrapped in <Stack>, not manual CSS gap. Import Stack from @/vr and wrap cards. This ensures consistent spacing and follows "There\'s a VR for that" doctrine.',
    },
    fixable: 'code',
    schema: [],
  },

  create(context) {
    return {
      JSXElement(node) {
        // Only check elements with 2+ children
        if (!node.children || node.children.length < 2) {
          return;
        }

        // Filter to JSX elements only (ignore text/expressions)
        const jsxChildren = node.children.filter(
          child => child.type === 'JSXElement'
        );

        if (jsxChildren.length < 2) {
          return;
        }

        // Count Card.standard children
        const cardStandardChildren = jsxChildren.filter(child => {
          const openingElement = child.openingElement;
          if (!openingElement) return false;

          const elementName = openingElement.name;

          // Handle <Card.standard>
          if (elementName.type === 'JSXMemberExpression') {
            return (
              elementName.object.name === 'Card' &&
              elementName.property.name === 'standard'
            );
          }

          return false;
        });

        // If 2+ Card.standard siblings found, check if parent is Stack
        if (cardStandardChildren.length >= 2) {
          const parentName = node.openingElement.name;

          // Check if parent is Stack component
          const isStack =
            parentName.type === 'JSXIdentifier' &&
            parentName.name === 'Stack';

          if (!isStack) {
            // Report violation
            context.report({
              node: node.openingElement,
              messageId: 'useStackVR',
              fix(fixer) {
                // Auto-fix: Wrap in <Stack>
                const sourceCode = context.getSourceCode();
                const openingTag = node.openingElement;
                const closingTag = node.closingElement;

                // Find the content between opening and closing tags
                const contentStart = openingTag.range[1];
                const contentEnd = closingTag ? closingTag.range[0] : node.range[1];
                const content = sourceCode.text.slice(contentStart, contentEnd);

                // Calculate indentation from first card
                const firstCard = cardStandardChildren[0];
                const firstCardLine = sourceCode.getText(firstCard).split('\n')[0];
                const baseIndent = firstCardLine.match(/^(\s*)/)[1];

                // Build replacement
                const replacement = `<Stack>${content}</Stack>`;

                return [
                  // Replace entire parent element with Stack wrapper
                  fixer.replaceText(node, replacement)
                ];
              }
            });
          }
        }
      }
    };
  }
};
