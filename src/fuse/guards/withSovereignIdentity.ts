/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ S.I.D. COMPLIANT - Server Action Identity Wrapper                │
│  /src/fuse/guards/withSovereignIdentity.ts                            │
│                                                                        │
│  Wraps Server Actions to enforce sovereign identity flow.             │
│  Automatically extracts userId (Convex _id) from FUSE session cookie. │
│                                                                        │
│  THE LAW (SID-5.3):                                                   │
│    Server Actions NEVER call Clerk getToken().                        │
│    Identity comes from FUSE session cookie._id ONLY.                  │
│    This wrapper enforces sovereign identity automatically.            │
│                                                                        │
│  Usage:                                                                │
│    'use server';                                                      │
│    import { withSovereignIdentity } from '@/fuse/guards/withSovereignIdentity';  │
│                                                                        │
│    export const myAction = withSovereignIdentity(                     │
│      async (userId, arg1, arg2) => {                                  │
│        // userId is sovereign Convex _id, guaranteed valid            │
│        await convex.mutation(api.foo, { userId, arg1, arg2 });        │
│      }                                                                │
│    );                                                                 │
│                                                                        │
│  Ref: S.I.D. Doctrine, Golden Bridge Pattern                          │
└────────────────────────────────────────────────────────────────────────┘ */

import { readSessionCookie } from '@/fuse/hydration/session/cookie';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Error thrown when session is invalid or missing
 */
export class SovereignIdentityError extends Error {
  constructor(message: string) {
    super(`[SOVEREIGN GUARD] ${message}`);
    this.name = 'SovereignIdentityError';
  }
}

/**
 * Result type for sovereign actions
 */
export type SovereignResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Wraps a Server Action to inject sovereign userId from FUSE session cookie.
 *
 * The wrapped function receives userId (Convex _id) as its first argument,
 * followed by any additional arguments passed when calling the action.
 *
 * 🛡️ SID-5.3: Returns sovereign Convex _id, NOT clerkId
 *
 * @example
 * // Define action
 * export const updateProfile = withSovereignIdentity(
 *   async (userId, data: ProfileData) => {
 *     return await convex.mutation(api.users.update, { userId, ...data });
 *   }
 * );
 *
 * // Call action (userId is auto-injected)
 * await updateProfile(data);
 */
export function withSovereignIdentity<TArgs extends unknown[], TResult>(
  handler: (userId: Id<"admin_users">, ...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<SovereignResult<TResult>> {
  return async (...args: TArgs): Promise<SovereignResult<TResult>> => {
    try {
      // 🛡️ SID-9.1: Read identity from FUSE session cookie
      const session = await readSessionCookie();

      if (!session) {
        return {
          success: false,
          error: 'No valid session. Please log in again.',
        };
      }

      // 🛡️ SID-5.3: Use sovereign _id, not clerkId
      if (!session._id) {
        return {
          success: false,
          error: 'Invalid session: missing sovereign identity. Please log in again.',
        };
      }

      // Execute handler with sovereign identity
      const result = await handler(session._id as Id<"admin_users">, ...args);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[SOVEREIGN GUARD] Action error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Simple helper to get sovereign userId from session cookie.
 * Use this when you need more control over the action structure.
 *
 * 🛡️ SID-5.3: Returns sovereign Convex _id, NOT clerkId
 *
 * @example
 * export async function myAction(arg1: string) {
 *   const userId = await getSovereignIdentity();
 *   if (!userId) throw new Error('Unauthorized');
 *
 *   return await convex.mutation(api.foo, { userId, arg1 });
 * }
 */
export async function getSovereignIdentity(): Promise<Id<"admin_users"> | null> {
  const session = await readSessionCookie();
  return session?._id ? (session._id as Id<"admin_users">) : null;
}

/**
 * Gets sovereign identity or throws if not authenticated.
 * Use this when you want the action to fail immediately on missing auth.
 *
 * 🛡️ SID-5.3: Returns sovereign Convex _id, NOT clerkId
 *
 * @example
 * export async function myAction(arg1: string) {
 *   const userId = await requireSovereignIdentity();
 *   // userId is sovereign Convex _id, guaranteed valid
 *
 *   return await convex.mutation(api.foo, { userId, arg1 });
 * }
 */
export async function requireSovereignIdentity(): Promise<Id<"admin_users">> {
  const session = await readSessionCookie();

  if (!session?._id) {
    throw new SovereignIdentityError('Not authenticated. Please log in.');
  }

  return session._id as Id<"admin_users">;
}

/**
 * @deprecated Use requireSovereignIdentity() instead
 */
export const requireSovereignIdentityFromCookie = requireSovereignIdentity;
