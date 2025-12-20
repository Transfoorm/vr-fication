/**
 * VRP Rule: no-foreign-auth
 *
 * Blocks any foreign authentication systems from entering the sovereign runtime.
 * Only FUSE cookie-based identity is allowed in domain views.
 *
 * FOREIGN AUTH SYSTEMS BLOCKED:
 *   - @clerk/* (Clerk)
 *   - next-auth (NextAuth)
 *   - @auth/* (Auth.js)
 *   - firebase/auth (Firebase Auth)
 *   - @supabase/auth-helpers-* (Supabase Auth)
 *   - passport (Passport.js)
 *
 * THE LAW:
 *   FUSE cookie is the ONLY identity source in domain views.
 *   All foreign auth must stay in /app/(auth)/** boundary.
 *
 * Ref: TTT-99-WAYS-CLERK-CAN-INFECT.md, Golden Bridge Pattern
 */

module.exports = {
  rules: {
    'no-foreign-auth': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow foreign authentication imports outside auth boundary',
          category: 'VRP Foreign Auth',
        },
        messages: {
          noForeignAuth: `⛔ VRP FOREIGN AUTH VIOLATION: Foreign authentication detected outside auth boundary.

FUSE cookie is the ONLY identity source in domain views.
Foreign auth systems must stay within /app/(auth)/** boundary.

Blocked imports:
  - @clerk/* (Clerk)
  - next-auth (NextAuth)
  - @auth/* (Auth.js)
  - firebase/auth (Firebase)
  - @supabase/auth-helpers-* (Supabase)

CORRECT:
  import { useFuse } from '@/store/fuse';
  const user = useFuse(s => s.user);

See: TTT-99-WAYS-CLERK-CAN-INFECT.md`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Exception zones - where foreign auth IS allowed
        const exceptionPatterns = [
          // ═══════════════════════════════════════════════════════════════
          // QUARANTINE ZONES - All Clerk code lives here
          // ═══════════════════════════════════════════════════════════════
          /\/app\/\(auth\)\//,              // Auth pages (sign-in, sign-up, forgot)
          /\/app\/\(clerk\)\//,             // Clerk quarantine (actions, api, features, webhooks)

          // ═══════════════════════════════════════════════════════════════
          // INFRASTRUCTURE
          // ═══════════════════════════════════════════════════════════════
          /\/providers\//,                   // Providers (ConvexClientProvider)
          /\/fuse\/hydration\//,             // Hydration utilities
          /middleware\.ts$/,                 // Auth middleware
          /\/app\/layout\.tsx$/,            // ClerkProvider wrapper (root layout only)

          // ═══════════════════════════════════════════════════════════════
          // TEST FILES
          // ═══════════════════════════════════════════════════════════════
          /\.test\.(ts|tsx|js|jsx)$/,        // Test files
          /\.spec\.(ts|tsx|js|jsx)$/,        // Spec files
        ];

        const isException = exceptionPatterns.some(pattern => pattern.test(filename));
        if (isException) {
          return {};
        }

        // Foreign auth packages to block
        const foreignAuthPackages = [
          '@clerk/',
          'next-auth',
          '@auth/',
          'firebase/auth',
          '@supabase/auth-helpers',
          'passport',
        ];

        return {
          ImportDeclaration(node) {
            const importSource = node.source.value;

            const isForeignAuth = foreignAuthPackages.some(pkg =>
              importSource === pkg || importSource.startsWith(pkg)
            );

            if (isForeignAuth) {
              context.report({
                node,
                messageId: 'noForeignAuth',
              });
            }
          },
        };
      },
    },
  },
};
