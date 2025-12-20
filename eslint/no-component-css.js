// ═══════════════════════════════════════════════════════════════════
// 🛡️ WCCC ARCHITECTURE ENFORCEMENT - Route-Level CSS Prevention
// ═══════════════════════════════════════════════════════════════════
// DISABLED - This rule is superseded by eslint.config.mjs page.css blocking
// Ref: styles/WCCC-PROTOCOL.md
//
// WCCC 5-File System (Current Architecture - 2025-11-23):
//   1. tokens.css     - Design system primitives
//   2. prebuilts.css  - vr-* components (IMPORT HUB)
//   3. layout.css     - ly-* shell structure (IMPORT HUB)
//   4. globals.css    - CSS reset + orchestrates imports
//   5. features.css   - ft-* features (IMPORT HUB)
//
// Component-Scoped CSS Pattern (ALLOWED):
//   ✅ /src/prebuilts/button/button.css → prebuilts.css → globals.css
//   ✅ /src/shell/Topbar/topbar.css → shell.css → layout.css → globals.css
//   ✅ /src/features/UserButton/user-button.css → features.css → globals.css
//
// Route-Level CSS (FORBIDDEN - blocked in eslint.config.mjs):
//   ❌ /src/app/domain/companies/page.css
//   ❌ /src/app/(auth)/sign-in/page.css
//
// Why Component CSS is Allowed:
//   - Maintainability: CSS defined near component
//   - Discoverability: Imported through 5 hub files
//   - Performance: All CSS bundled globally (no lazy loading)
//
// Why page.css is Forbidden:
//   - Destroys discoverability (CSS scattered across routes)
//   - Creates maintenance nightmares (find all styles?)
//   - Violates WCCC semantic prefixes (vr-, ly-, ft-)
//
// Protection Strategy (Active):
//   eslint.config.mjs lines 176-191 blocks page.css imports directly
//   This custom rule is deprecated but kept for documentation
//
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  rules: {
    'no-component-css': {
      create(context) {
        return {
          Program(node) {
            const filename = context.getFilename();

            // Skip if not a TypeScript/JavaScript file
            if (!filename.match(/\.(tsx?|jsx?)$/)) return;

            // Check for CSS imports in route files
            const importDeclarations = node.body.filter(
              n => n.type === 'ImportDeclaration'
            );

            importDeclarations.forEach(importNode => {
              const importPath = importNode.source.value;

              // Detect route-level page.css files (FORBIDDEN)
              const isRouteLevelCSS =
                importPath.match(/\/page\.css$/) ||
                importPath.match(/\.\/page\.css$/);

              if (isRouteLevelCSS) {
                context.report({
                  node: importNode,
                  message: `⛔ WCCC VIOLATION: Route-level CSS files are forbidden. Use the 5-file WCCC system instead.

WCCC 5-File System:
  1. tokens.css     - Design tokens
  2. prebuilts.css  - vr-* components (hub)
  3. layout.css     - ly-* shell (hub)
  4. globals.css    - Reset + orchestration
  5. features.css   - ft-* features (hub)

For custom styling:
  1. Check if a prebuilt variant exists (vr-button-primary, vr-card-alert, etc.)
  2. Create new prebuilt variant in /src/prebuilts/[component]/
  3. Last resort: Create feature component in /src/features/[Feature]/

Component-scoped CSS IS allowed when imported through hubs:
  ✅ /src/prebuilts/button/button.css → prebuilts.css
  ✅ /src/features/UserButton/user-button.css → features.css
  ❌ /src/app/domain/companies/page.css (route-level CSS)

Ref: styles/WCCC-PROTOCOL.md`,
                });
              }
            });
          }
        };
      }
    }
  }
};
