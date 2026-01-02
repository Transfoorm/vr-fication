// Custom ESLint rule: enforce-class-prefix
// Ensures 5-file CSS architecture compliance (WCCC)
//
// WCCC Prefix Rules:
// - VR components (/src/vr/): MUST use vr-* only (pure component library)
// - Shell components (/src/shell/): MUST use ly-* or vr-* (layout + can use VR)
// - Feature components (/src/features/): MUST use ft-*, vr-*, or ly-* (can use all)
//
// Classes with no valid prefix are violations.

module.exports = {
  rules: {
    'enforce-class-prefix': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce FUSE-STYLE 5-file class prefix discipline',
          category: 'Best Practices',
        },
        messages: {
          wrongPrefix: '{{ message }}',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (node.name.name !== 'className') return;

            const filename = context.getFilename();
            const classValue = node.value?.value || '';

            // Skip if no class value
            if (!classValue) return;

            // Valid prefix patterns
            const hasVrPrefix = /\bvr-/.test(classValue);
            const hasLyPrefix = /\bly-/.test(classValue);
            const hasFtPrefix = /\bft-/.test(classValue);

            // VR components: MUST use vr-* only (pure component library)
            if (filename.includes('/src/vr/')) {
              if (!hasVrPrefix) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: VR components must use vr-* class prefix (5-file system: vr.css). Ref: WCCC-PROTOCOL.md',
                  },
                });
              }
              return;
            }

            // Shell components: MUST use ly-* or vr-* (layout layer, can use VR)
            if (filename.includes('/src/shell/')) {
              if (!hasLyPrefix && !hasVrPrefix) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: Shell components must use ly-* or vr-* class prefix. Ref: WCCC-PROTOCOL.md',
                  },
                });
              }
              return;
            }

            // Feature components: MUST use ft-*, vr-*, or ly-* (can use all component libraries)
            if (filename.includes('/src/features/')) {
              if (!hasFtPrefix && !hasVrPrefix && !hasLyPrefix) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: Feature components must use ft-*, vr-*, or ly-* class prefix. Ref: WCCC-PROTOCOL.md',
                  },
                });
              }
            }
          },
        };
      },
    },
  },
};
