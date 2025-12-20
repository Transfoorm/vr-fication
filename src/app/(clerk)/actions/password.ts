/**
 * 🛡️ S.I.D. COMPLIANT Password Actions
 * Purpose: Change password via Clerk Backend API
 * SPECIAL CASE per SID-12.1:
 * These actions call Clerk API for password management.
 * Identity is sourced from session.clerkId (FUSE cookie), NOT auth().
 *
 * SID Rules Enforced:
 * - SID-3.1: auth() does NOT appear here
 * - SID-12.1: Password actions use session.clerkId from FUSE cookie
 * - SID-9.1: Identity originates from readSessionCookie()
 *
 * REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
 */

'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';

/**
 * Change user's password
 * Uses Clerk Backend API - no reverification needed
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 *
 * Password Requirements:
 * - Minimum 6 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 symbol
 */
export async function changePassword(newPassword: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  // Validate password requirements
  if (!newPassword || typeof newPassword !== 'string') {
    return { error: 'New password is required' };
  }

  if (newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' };
  }

  if (!/[A-Z]/.test(newPassword)) {
    return { error: 'Password must include at least 1 uppercase letter' };
  }

  if (!/[0-9]/.test(newPassword)) {
    return { error: 'Password must include at least 1 number' };
  }

  if (!/[^a-zA-Z0-9]/.test(newPassword)) {
    return { error: 'Password must include at least 1 symbol' };
  }

  try {
    const client = await clerkClient();

    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    await client.users.updateUser(session.clerkId, {
      password: newPassword,
    });

    return { success: true };
  } catch (err) {
    console.error('Failed to change password:', err);

    // Type guard for Clerk errors
    const clerkError = err as { errors?: Array<{ message?: string; longMessage?: string }> };

    if (clerkError.errors?.[0]) {
      const firstError = clerkError.errors[0];
      return { error: firstError.longMessage || firstError.message || 'Unknown error' };
    }

    return { error: 'Failed to change password' };
  }
}
