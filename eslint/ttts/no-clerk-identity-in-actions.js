/**
 * TTTS Rule: no-clerk-identity-in-actions (CATEGORY K - GOLDEN BRIDGE IDENTITY BREACH)
 *
 * Prevents Clerk identity APIs from crossing into Server Actions outside /auth/** boundary.
 *
 * THE LAW:
 *   Server Actions MUST read identity from FUSE session cookie (readSessionCookie).
 *   Only /app/(auth)/actions/** may call Clerk identity APIs.
 *   Any Server Action generating/injecting Clerk tokens = SOVEREIGNTY BREACH.
 *
 * VIOLATIONS:
 *   const token = await getToken({ template: 'convex' });  // ❌ Identity generation
 *   convex.setAuth(token);  // ❌ Token injection
 *   await clerkClient.sessions.revokeSession();  // ❌ Direct session manipulation
 *
 * CORRECT:
 *   const session = await readSessionCookie();  // ✅ FUSE sovereign identity
 *   convex.mutation(api.foo, { callerClerkId: session.clerkId });  // ✅ Pass as arg
 *
 * Exception zones (where Clerk identity IS allowed):
 *   - app/(auth)/** - Auth boundary (login, register, session mint)
 *   - app/api/session/** - Session management routes
 *
 * Ref: Clerk Knox, Category K, Golden Bridge Pattern
 */

module.exports = {
  rules: {
    'no-clerk-identity-in-actions': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow Clerk identity APIs in Server Actions outside auth boundary',
          category: 'TTTS Golden Bridge',
        },
        messages: {
          noGetToken: `⛔ CATEGORY K VIOLATION: getToken() is forbidden outside /auth/** boundary.

Server Actions MUST read identity from FUSE session cookie, not generate Clerk tokens.

WRONG:
  const { getToken } = await auth();
  const token = await getToken({ template: 'convex' });
  convex.setAuth(token);

CORRECT:
  const session = await readSessionCookie();
  convex.mutation(api.foo, { callerClerkId: session.clerkId });

The FUSE cookie IS your identity. Clerk token generation belongs in /auth/** only.
See: Clerk Knox, Category K`,

          noSetAuth: `⛔ CATEGORY K VIOLATION: convex.setAuth() is forbidden outside /auth/** boundary.

Injecting Clerk tokens into Convex client bypasses FUSE sovereignty.
Convex mutations should receive callerClerkId as an argument, not via token injection.

WRONG:
  convex.setAuth(token);
  await convex.mutation(api.foo, { ...args });

CORRECT:
  const session = await readSessionCookie();
  await convex.mutation(api.foo, { callerClerkId: session.clerkId, ...args });

See: Clerk Knox, Category K`,

          noSessionRevoke: `⛔ CATEGORY K VIOLATION: Direct Clerk session manipulation is forbidden outside /auth/** boundary.

Session management belongs in the /auth/** boundary only.
Server Actions in domain territory should never touch Clerk sessions.

See: Clerk Knox, Category K`,
        },
      },
      create(context) {
        const filename = context.getFilename();

        // Exception zones - where Clerk identity IS allowed
        const exceptionPatterns = [
          /\/app\/\(auth\)\//,              // Auth boundary
          /\/app\/api\/session\//,          // Session management routes
          /\/app\/api\/webhooks\//,         // Webhook handlers (Clerk events)
          /\.test\.(ts|tsx|js|jsx)$/,       // Test files
          /\.spec\.(ts|tsx|js|jsx)$/,       // Spec files
        ];

        const isException = exceptionPatterns.some(pattern => pattern.test(filename));
        if (isException) {
          return {};
        }

        // Only enforce in Server Actions
        const enforcePatterns = [
          /\/app\/actions\//,               // Server Actions directory
          /\/actions\/.*\.ts$/,             // Any actions file
        ];

        const shouldEnforce = enforcePatterns.some(pattern => pattern.test(filename));
        if (!shouldEnforce) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for getToken() calls
            if (node.callee.name === 'getToken') {
              context.report({
                node,
                messageId: 'noGetToken',
              });
              return;
            }

            // Check for convex.setAuth() or *.setAuth() calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.property.name === 'setAuth'
            ) {
              context.report({
                node,
                messageId: 'noSetAuth',
              });
              return;
            }

            // Check for clerkClient.sessions.* calls
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'MemberExpression' &&
              node.callee.object.property.name === 'sessions'
            ) {
              context.report({
                node,
                messageId: 'noSessionRevoke',
              });
              return;
            }
          },

          // Also catch destructured getToken from auth()
          VariableDeclarator(node) {
            if (
              node.id.type === 'ObjectPattern' &&
              node.id.properties.some(
                prop => prop.key && prop.key.name === 'getToken'
              )
            ) {
              context.report({
                node,
                messageId: 'noGetToken',
              });
            }
          },
        };
      },
    },
  },
};
