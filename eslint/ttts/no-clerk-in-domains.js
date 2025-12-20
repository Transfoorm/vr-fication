/**
 * TTTS Rule: no-clerk-in-domains (GOLDEN BRIDGE ENFORCEMENT)
 *
 * Enforces Clerk relegation - domain views must get user data from FUSE store,
 * not directly from Clerk via useUser/useAuth/useClerk.
 *
 * THE LAW:
 *   Clerk authenticates → Cookie holds user data → FUSE owns it
 *   Domain views read from FUSE only.
 *   Clerk is relegated to authentication ONLY.
 *
 * VIOLATION:
 *   import { useUser } from '@clerk/nextjs';
 *   const { user } = useUser();  // ❌ Direct Clerk access in domain
 *
 * CORRECT:
 *   import { useFuse } from '@/store/fuse';
 *   const user = useFuse(s => s.user);  // ✅ Reads from FUSE
 *
 * Exception zones (where Clerk IS allowed):
 *   - app/(auth)/* - Auth pages (login, register, etc.)
 *   - src/providers/* - Providers that bridge Clerk → FUSE
 *   - src/fuse/hydration/* - Hydration utilities
 *   - middleware.ts - Auth middleware
 *   - vanish/Quarantine.tsx - Clerk quarantine zone
 *
 * Ref: Golden Bridge Pattern, SRB-7
 */

module.exports = {
  rules: {
    'no-clerk-in-domains': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow Clerk imports in domain view files',
          category: 'TTTS Golden Bridge',
        },
        messages: {
          noClerkInDomains: `⛔ GOLDEN BRIDGE VIOLATION: Domain views may NEVER import from @clerk/nextjs.

Clerk is relegated to AUTHENTICATION ONLY.
User data flows through the Golden Bridge:
  1. Clerk authenticates → JWT issued
  2. Session data written to cookie
  3. Cookie hydrates FUSE store
  4. Domain views read from FUSE

WRONG:
  import { useUser } from '@clerk/nextjs';
  const { user } = useUser();

CORRECT:
  import { useFuse } from '@/store/fuse';
  const user = useFuse(s => s.user);

See: Golden Bridge Pattern, SRB-7`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Exception zones - where Clerk IS allowed
        const exceptionPatterns = [
          /\/app\/\(auth\)\//,              // Auth pages (login, register)
          /\/providers\//,                   // Providers (bridge Clerk → FUSE)
          /\/fuse\/hydration\//,             // Hydration utilities
          /middleware\.ts$/,                 // Auth middleware
          /\/vanish\/Quarantine\.tsx$/,      // Clerk quarantine zone
          /\/hooks\/useConvexUser\.ts$/,     // User sync hook
          /\/features\/shell\/UserButton\//,  // Auth UI - sign out flow
          /\/features\/setup\//,             // Auth UI - onboarding/verification
          /\/features\/account\/PasswordTab\/VerifyModal\//, // Email verification modal
          /\.test\.(ts|tsx|js|jsx)$/,        // Test files
          /\.spec\.(ts|tsx|js|jsx)$/,        // Spec files
        ];

        const isException = exceptionPatterns.some(pattern => pattern.test(filename));
        if (isException) {
          return {};
        }

        // Enforce in domain views (Sovereign Router structure)
        const enforcePatterns = [
          /\/app\/domains\//,              // Domain views
          /\/components\/.*\.tsx$/,        // Component files
          /\/features\/.*\.tsx$/,          // Feature components
          /\/prebuilts\/.*\.tsx$/,         // Prebuilt components
        ];

        const shouldEnforce = enforcePatterns.some(pattern => pattern.test(filename));
        if (!shouldEnforce) {
          return {};
        }

        return {
          ImportDeclaration(node) {
            // Check for any import from @clerk/nextjs
            if (node.source.value === '@clerk/nextjs') {
              context.report({
                node,
                messageId: 'noClerkInDomains',
              });
            }
          },

          CallExpression(node) {
            // Also catch useUser/useAuth/useClerk calls even if imported differently
            const clerkHooks = ['useUser', 'useAuth', 'useClerk', 'useSession', 'useSignIn', 'useSignUp'];

            if (
              node.callee.name && clerkHooks.includes(node.callee.name)
            ) {
              context.report({
                node,
                messageId: 'noClerkInDomains',
              });
            }
          },
        };
      },
    },
  },
};
