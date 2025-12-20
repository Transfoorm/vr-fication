// ═══════════════════════════════════════════════════════════════════
// 🛡️ TYPOGRAPHY SOVEREIGNTY ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════
// Objective: Enforce Typography Sovereignty at compile time.
//
// Any text that appears in the UI must pass through a Typography VR.
// Violations are ERRORS, not warnings.
//
// This lint exists to prevent:
//   • Hierarchy drift
//   • Cascade-based typography
//   • Feature-level font manipulation
//   • Silent accessibility regressions
//
// The FUSE doctrine does not permit direct text styling.
// Fix the VR. Do not weaken the law.
// ═══════════════════════════════════════════════════════════════════

const FOOTER_MESSAGE = `

You have attempted to style language directly.
The FUSE doctrine does not permit this.`;

// Typography VR component names (allowed)
const TYPOGRAPHY_VRS = [
  'Typography.title',
  'Typography.heading',
  'Typography.body',
  'Typography.caption',
  'TypographyTitle',
  'TypographyHeading',
  'TypographyBody',
  'TypographyCaption',
  // T namespace (short alias)
  'T.title',
  'T.heading',
  'T.body',
  'T.caption',
  // T heading shortcuts
  'T.h2',
  'T.h3',
  'T.h4',
  'T.h5',
  'T.h6',
];

// HTML typography tags (forbidden in app code)
// Note: span removed - often used for inline styling within Typography VRs
const FORBIDDEN_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'small'];

// Native controls that CAN contain raw text
const ALLOWED_TEXT_PARENTS = [
  'button',
  'input',
  'textarea',
  'label',
  'option',
  'select',
  'title',
  'alt',
  'aria-label',
  'aria-description',
  'a', // Anchor tags for links
  'li', // List items
  // Inline formatting tags (used inside Typography VRs)
  'strong',
  'em',
  'code',
  'u',
  'i',
  'b',
  'sup',
  'sub',
  'span', // Used for inline styling (gradients, highlights, etc.)
  // Button VRs (they handle their own text styling)
  'Button.primary',
  'Button.secondary',
  'Button.fire',
  'Button.link',
  'Button.minimal',
  // Label VRs (semantic labels for inputs)
  'Label.basic',
  ...TYPOGRAPHY_VRS
];

// Paths exempt from Typography Sovereignty
const EXEMPT_PATHS = [
  '/src/prebuilts/typography/',
  '/test/',
  '/__tests__/',
  '.test.',
  '.spec.',
];

function isExemptFile(filename) {
  return EXEMPT_PATHS.some(path => filename.includes(path));
}

function isTypographyVR(node) {
  if (!node || !node.openingElement) return false;
  const name = node.openingElement.name;

  // Handle JSXMemberExpression (Typography.title or T.body)
  if (name.type === 'JSXMemberExpression') {
    return name.object.name === 'Typography' || name.object.name === 'T';
  }

  // Handle JSXIdentifier (TypographyTitle)
  if (name.type === 'JSXIdentifier') {
    return TYPOGRAPHY_VRS.includes(name.name);
  }

  return false;
}

function isAllowedTextParent(node) {
  if (!node || !node.openingElement) return false;
  const name = node.openingElement.name;

  if (name.type === 'JSXIdentifier') {
    return ALLOWED_TEXT_PARENTS.includes(name.name);
  }

  if (name.type === 'JSXMemberExpression') {
    // Typography.* and T.* are allowed
    if (name.object.name === 'Typography' || name.object.name === 'T') {
      return true;
    }
    // Button.* are allowed (they handle their own text)
    if (name.object.name === 'Button') {
      return true;
    }
    // Label.* are allowed (semantic labels)
    if (name.object.name === 'Label') {
      return true;
    }
  }

  return false;
}

module.exports = {
  rules: {
    // ═══════════════════════════════════════════════════════════════════
    // RULE 1: Ban raw text nodes in DOM components
    // ═══════════════════════════════════════════════════════════════════
    'no-raw-text-nodes': {
      create(context) {
        return {
          JSXText(node) {
            const filename = context.getFilename();
            if (isExemptFile(filename)) return;

            // Skip whitespace-only nodes
            const text = node.value.trim();
            if (!text) return;

            // Check if parent is an allowed text container
            let parent = node.parent;
            while (parent) {
              if (parent.type === 'JSXElement') {
                if (isAllowedTextParent(parent)) {
                  return; // Text is inside an allowed component
                }
                // Found a JSX parent that's not allowed
                break;
              }
              parent = parent.parent;
            }

            context.report({
              node,
              message: `⛔ TYPOGRAPHY SOVEREIGNTY VIOLATION: Raw text nodes are forbidden.

Found: "${text}"

All text must pass through Typography VRs:
  ✅ <T.body>{text}</T.body>
  ✅ <T.caption>{text}</T.caption>
  ✅ <T.h3>{text}</T.h3>
  ❌ <div>{text}</div>
  ❌ <span>{text}</span>${FOOTER_MESSAGE}`,
            });
          }
        };
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // RULE 2: Ban HTML typography tags in app domains
    // ═══════════════════════════════════════════════════════════════════
    'no-html-typography-tags': {
      create(context) {
        return {
          JSXOpeningElement(node) {
            const filename = context.getFilename();
            if (isExemptFile(filename)) return;

            // Check files in app/domains, app/features, features/, shell/, prebuilts/
            const isAppCode =
              filename.includes('/src/app/domains/') ||
              filename.includes('/src/app/features/') ||
              filename.includes('/src/features/') ||
              filename.includes('/src/shell/') ||
              filename.includes('/src/prebuilts/');

            if (!isAppCode) return;

            const tagName = node.name.type === 'JSXIdentifier' ? node.name.name : null;

            if (FORBIDDEN_TAGS.includes(tagName)) {
              const replacement = {
                h1: 'T.title',
                h2: 'T.h2',
                h3: 'T.h3',
                h4: 'T.h4',
                h5: 'T.h5',
                h6: 'T.h6',
                p: 'T.body',
                span: 'T.caption',
                small: 'T.caption size="xs"',
              }[tagName];

              context.report({
                node,
                message: `⛔ TYPOGRAPHY SOVEREIGNTY VIOLATION: HTML typography tags are forbidden.

Found: <${tagName}>
Use instead: <${replacement}>

HTML typography tags bypass the VR system and create:
  • Inconsistent visual hierarchy
  • Accessibility regressions
  • Maintenance nightmares${FOOTER_MESSAGE}`,
              });
            }
          }
        };
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // RULE 4: Heading integrity - no size prop on Typography.heading
    // ═══════════════════════════════════════════════════════════════════
    'no-heading-size-override': {
      create(context) {
        return {
          JSXOpeningElement(node) {
            const filename = context.getFilename();
            if (isExemptFile(filename)) return;

            // Check if this is Typography.heading or TypographyHeading
            const isHeading =
              (node.name.type === 'JSXMemberExpression' &&
               node.name.object.name === 'Typography' &&
               node.name.property.name === 'heading') ||
              (node.name.type === 'JSXIdentifier' &&
               node.name.name === 'TypographyHeading');

            if (!isHeading) return;

            // Check for size prop
            const sizeAttr = node.attributes.find(
              attr => attr.type === 'JSXAttribute' && attr.name.name === 'size'
            );

            if (sizeAttr) {
              context.report({
                node: sizeAttr,
                message: `⛔ TYPOGRAPHY SOVEREIGNTY VIOLATION: Heading size is determined by level.

Typography.heading uses the Pure System:
  • Level determines BOTH semantics AND size
  • Level 2 = h2 + 2xl size + bold weight
  • Level 3 = h3 + xl size + semibold weight
  • Level 4 = h4 + lg size + medium weight
  • Level 5/6 = h5/h6 + md size + normal weight

Remove the size prop and use the correct level instead.${FOOTER_MESSAGE}`,
              });
            }
          }
        };
      }
    },

    // ═══════════════════════════════════════════════════════════════════
    // RULE 5: No className on Typography VRs (removed - handled by VR code itself)
    // ═══════════════════════════════════════════════════════════════════
    // Typography VRs no longer accept className props (removed in implementation)
    // TypeScript will catch this at compile time

    // ═══════════════════════════════════════════════════════════════════
    // RULE 6: No prop sprawl on Typography VRs
    // ═══════════════════════════════════════════════════════════════════
    'no-prop-sprawl': {
      create(context) {
        return {
          JSXOpeningElement(node) {
            const filename = context.getFilename();

            // Exempt showcase/demo files (they demonstrate all props)
            if (isExemptFile(filename) || filename.includes('/showcase/')) return;

            const name = node.name;

            // Check if this is a Typography VR (T.* or Typography.*)
            const isTypographyVR =
              name.type === 'JSXMemberExpression' &&
              (name.object.name === 'T' || name.object.name === 'Typography');

            if (!isTypographyVR) return;

            // Count semantic props (exclude children, className, key, id)
            const semanticProps = node.attributes.filter(
              (attr) =>
                attr.type === 'JSXAttribute' &&
                !['children', 'className', 'key', 'id'].includes(attr.name.name)
            );

            // Threshold: 3 props maximum (e.g., size, weight, color)
            const MAX_PROPS = 3;

            if (semanticProps.length > MAX_PROPS) {
              const propNames = semanticProps.map((attr) => attr.name.name).join(', ');

              context.report({
                node,
                message: `⛔ TYPOGRAPHY VR SPRAWL DETECTED

Found: ${semanticProps.length} props (${propNames})
Limit: ${MAX_PROPS} props maximum

Typography VRs must remain simple. More than ${MAX_PROPS} props indicates
you need a NEW semantic VR, not more props on an existing one.

Examples of clean usage:
  ✅ <T.body size="lg" weight="semibold">
  ✅ <T.caption color="secondary">
  ✅ <T.h3>

Examples of sprawl (forbidden):
  ❌ <T.body size="lg" weight="bold" color="primary" tone="warm">

Instead, create a new semantic VR:
  ✅ <T.callout> (with built-in bold + primary + warm semantics)
  ✅ <T.highlight> (with built-in emphasis styling)

Doctrine: Keep variants finite. Add VRs when semantics change, not aesthetics.
See: /_sdk/11-conventions/Typography-Migration-Completion-Statement.md${FOOTER_MESSAGE}`,
              });
            }
          },
        };
      },
    },
  }
};
