/**
 * TTTS ESLint Plugin - Triple-T Sovereignty Enforcement
 *
 * This plugin enforces FUSE/ADP/PRISM/WARP architectural sovereignty.
 * It is not optional. It is not advisory. It is sovereign.
 *
 * Rules:
 *   - no-direct-convex-in-pages: Enforces Golden Bridge pattern (TTTS-2)
 *   - no-cross-domain-imports: Enforces domain sovereignty (TTTS-5)
 *   - enforce-slice-shape: Enforces FUSE/ADP slice contract (TTTS-1)
 *   - no-lazy-domains: Blocks dynamic()/React.lazy() in domain views (TTTS-6)
 *   - no-runtime-debt: Blocks useEffect fetch chains and async hooks (TTTS-7)
 *   - no-clerk-in-domains: Enforces Clerk relegation / Golden Bridge (SRB-7)
 *   - no-clerk-identity-in-actions: Blocks Clerk identity APIs in Server Actions (Category K)
 *   - enforce-vanish-manifest: Enforces VANISH cascade coverage (VANISH-1)
 *
 * When these rules pass:
 *   - No one can bypass Golden Bridge
 *   - No domain can leak into another
 *   - No slice can drift from ADP contract
 *   - Strategy 1 (full domain preload) becomes impossible to break
 *   - Clerk stays relegated to auth only
 *   - Server Actions use FUSE cookie identity, not Clerk tokens
 *   - User data cannot be orphaned on deletion
 *
 * Ref: TTTS-ENFORCEMENT-PACK-(v1.0).md, Clerk Knox
 *
 * ██████████████████████████████████████████████
 * ⚠️  TTTS GOD IS WATCHING
 * Only ONE correct path exists.
 * Clean your code and honor the Triple Ton Law.
 * ██████████████████████████████████████████████
 */

const noDirectConvexInPages = require('./no-direct-convex-in-pages.js');
const noCrossDomainImports = require('./no-cross-domain-imports.js');
const enforceSliceShape = require('./enforce-slice-shape.js');
const noLazyDomains = require('./no-lazy-domains.js');
const noRuntimeDebt = require('./no-runtime-debt.js');
const noClerkInDomains = require('./no-clerk-in-domains.js');
const noClerkIdentityInActions = require('./no-clerk-identity-in-actions.js');
const enforceVanishManifest = require('./enforce-vanish-manifest.js');

module.exports = {
  rules: {
    'no-direct-convex-in-pages': noDirectConvexInPages.rules['no-direct-convex-in-pages'],
    'no-cross-domain-imports': noCrossDomainImports.rules['no-cross-domain-imports'],
    'enforce-slice-shape': enforceSliceShape.rules['enforce-slice-shape'],
    'no-lazy-domains': noLazyDomains.rules['no-lazy-domains'],
    'no-runtime-debt': noRuntimeDebt.rules['no-runtime-debt'],
    'no-clerk-in-domains': noClerkInDomains.rules['no-clerk-in-domains'],
    'no-clerk-identity-in-actions': noClerkIdentityInActions.rules['no-clerk-identity-in-actions'],
    'enforce-vanish-manifest': enforceVanishManifest.rules['enforce-vanish-manifest'],
  },
};
