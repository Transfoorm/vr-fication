/**
 * VRP Rule: no-eslint-disable
 *
 * Blocks all eslint-disable comments to prevent VRP bypass.
 *
 * VIOLATIONS:
 *   ❌ // eslint-disable
 *   ❌ // eslint-disable-next-line
 *   ❌ // eslint-disable-line
 *   ❌ /* eslint-disable *\/
 *
 * RATIONALE:
 *   eslint-disable comments bypass all VRP protection layers.
 *   If a rule needs an exception, add it to eslint.config.mjs
 *   (which requires @Metafoorm approval via CODEOWNERS).
 *
 * Ref: VRP-PROTOCOL.md Layer 1 "No @ts-ignore or @ts-expect-error"
 *      (eslint-disable is the ESLint equivalent)
 */

module.exports = {
  rules: {
    'no-eslint-disable': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow eslint-disable comments (VRP bypass prevention)',
          category: 'VRP - Virgin Repo Protocol',
          recommended: true,
        },
        messages: {
          noEslintDisable:
            '🛑 VRP VIOLATION: eslint-disable comments bypass Virgin-Repo protection.\n\n' +
            'If you need an exception:\n' +
            '  1. Add file/pattern exception to eslint.config.mjs\n' +
            '  2. Submit PR for @Metafoorm approval (CODEOWNERS protected)\n\n' +
            'No shortcuts. No bypasses. Virgin-Repo Protocol is absolute.\n\n' +
            'Ref: VRP-PROTOCOL.md Layer 1',
        },
        schema: [],
      },
      create(context) {
        const sourceCode = context.getSourceCode();

        return {
          Program(node) {
            const comments = sourceCode.getAllComments();

            comments.forEach((comment) => {
              const value = comment.value.trim();

              // Match any eslint-disable variant
              const disablePattern = /eslint-disable(-next-line|-line)?/i;

              if (disablePattern.test(value)) {
                context.report({
                  loc: comment.loc,
                  messageId: 'noEslintDisable',
                });
              }
            });
          },
        };
      },
    },
  },
};
