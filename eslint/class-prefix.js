// Custom ESLint rule: enforce-class-prefix
// Ensures 5-file CSS architecture compliance
// DISABLED FOR NOW - Will enable after full 5-file migration

module.exports = {
  rules: {
    'enforce-class-prefix-DISABLED': {
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

            // ut-* allowed anywhere
            if (classValue.includes('ut-')) return;

            // Prebuilts must use vr-* (Variant Robot architecture)
            if (filename.includes('/prebuilts/') || filename.includes('/src/prebuilts/')) {
              if (!classValue.match(/\bvr-/)) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: Prebuilt components must use vr-* class prefix (Variant Robot architecture). All VR classes follow strict parent-child naming hierarchy. Ref: 04-VRS-COMPONENT-SYSTEM.md',
                  },
                });
              }
            }

            // Shell components must use sh-*
            if (filename.includes('/appshell/') || filename.includes('/src/appshell/')) {
              if (!classValue.match(/\bsh-/)) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: Shell components must use sh-* class prefix (5-file system: shell.css). Ref: 03-FUSE-STYLE-5-FILE-ARCHITECTURE.md',
                  },
                });
              }
            }

            // Features must use ft-*
            if (filename.includes('/features/') || filename.includes('/src/components/features/')) {
              if (!classValue.match(/\bft-/)) {
                context.report({
                  node,
                  messageId: 'wrongPrefix',
                  data: {
                    message: '⛔ PREFIX VIOLATION: Feature components must use ft-* class prefix (5-file system: feature.css). Ref: 03-FUSE-STYLE-5-FILE-ARCHITECTURE.md',
                  },
                });
              }
            }

            // Pages must use pg-*
            if (filename.includes('/app/') && filename.includes('/page.tsx')) {
              if (!classValue.match(/\bpg-/) && !classValue.match(/\but-/) && !classValue.match(/\bpb-/) && !classValue.match(/\bsh-/)) {
                // Pages can use pg-*, ut-*, pb-*, sh-* but should primarily use pg-* for page-specific styles
                // Only warn if they're using custom classes without any prefix
                if (!classValue.match(/^(pg-|ut-|pb-|sh-|ft-)/)) {
                  context.report({
                    node,
                    messageId: 'wrongPrefix',
                    data: {
                      message: '⛔ PREFIX VIOLATION: Page components should use pg-* for page-specific styles (5-file system: page.css). Allowed: pg-*, ut-*, pb-*, sh-*. Ref: 03-FUSE-STYLE-5-FILE-ARCHITECTURE.md',
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
