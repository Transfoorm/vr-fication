'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

/**
 * Sign out user - Sovereign Auth Boundary action
 *
 * 1. Revoke Clerk session (server-side)
 * 2. Delete FUSE hydration cookie
 * 3. Delete Clerk session cookie
 * 4. Return success - client handles redirect
 *
 * NOTE: We delete Clerk's __session cookie server-side to prevent auto-re-auth
 */
export async function signOutAction() {
  // 1. Revoke Clerk session server-side
  const { sessionId } = await auth();
  if (sessionId) {
    const client = await clerkClient();
    await client.sessions.revokeSession(sessionId);
  }

  // 2. Delete FUSE identity cookie
  const cookieStore = await cookies();
  cookieStore.delete('FUSE_5.0');

  // 3. Delete Clerk session cookie (prevents auto-re-auth)
  cookieStore.delete('__session');
  cookieStore.delete('__client_uat');

  return { success: true };
}
