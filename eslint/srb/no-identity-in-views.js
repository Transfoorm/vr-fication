/**
 * SRB Rule: no-identity-in-views
 *
 * Blocks identity resolution logic in domain views.
 * Views must read pre-resolved identity from FUSE store.
 *
 * BLOCKED PATTERNS:
 *   - getToken() calls
 *   - auth() calls
 *   - currentUser() calls
 *   - getUserIdentity() calls
 *   - clerkClient() calls
 *   - Any identity resolution at runtime
 *
 * THE LAW:
 *   Identity is resolved ONCE at auth boundary.
 *   Cookie carries identity.
 *   FUSE store holds identity.
 *   Views READ identity, never RESOLVE it.
 *
 * Ref: SRB-7, TTT-99-WAYS-CLERK-CAN-INFECT.md Category K
 */

module.exports = {
  rules: {
    'no-identity-in-views': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow identity resolution logic in domain views',
          category: 'SRB Identity Protection',
        },
        messages: {
          noIdentityInViews: `⛔ SRB IDENTITY VIOLATION: Identity resolution detected in domain view.

Views must READ identity from FUSE, never RESOLVE it.

Identity resolution functions blocked:
  - getToken()
  - auth()
  - currentUser()
  - getUserIdentity()
  - clerkClient()

CORRECT:
  import { useFuse } from '@/store/fuse';
  const user = useFuse(s => s.user);  // Pre-resolved identity

See: SRB-7, TTT-99-WAYS-CLERK-CAN-INFECT.md Category K`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Only enforce in domain views and features
        const enforcePatterns = [
          /\/app\/domains\//,
          /\/features\/.*\.tsx$/,
          /\/prebuilts\/.*\.tsx$/,
        ];

        const shouldEnforce = enforcePatterns.some(pattern => pattern.test(filename));
        if (!shouldEnforce) {
          return {};
        }

        // Exception zones
        const exceptionPatterns = [
          /\/app\/\(auth\)\//,
          /\/providers\//,
          /\/fuse\/hydration\//,
          /middleware\.ts$/,
          /\/features\/verify\//,          // Verify features need auth
          /\/features\/setup\//,           // Setup needs auth
          /\/features\/shell\/UserButton/, // Sign out needs auth
        ];

        const isException = exceptionPatterns.some(pattern => pattern.test(filename));
        if (isException) {
          return {};
        }

        // Identity resolution functions to block
        const identityFunctions = [
          'getToken',
          'auth',
          'currentUser',
          'getUserIdentity',
          'clerkClient',
          'getAuth',
          'setAuth',
        ];

        return {
          CallExpression(node) {
            let functionName = null;

            // Direct call: getToken()
            if (node.callee.name) {
              functionName = node.callee.name;
            }
            // Member call: ctx.auth.getUserIdentity()
            else if (node.callee.property && node.callee.property.name) {
              functionName = node.callee.property.name;
            }

            if (functionName && identityFunctions.includes(functionName)) {
              context.report({
                node,
                messageId: 'noIdentityInViews',
              });
            }
          },
        };
      },
    },
  },
};
