/**─────────────────────────────────────────────────────────────────────────┐
│  🛡️ S.I.D. COMPLIANT Recovery Actions                                     │
│  /src/app/(clerk)/actions/recovery.ts                                      │
│                                                                            │
│  Admin-initiated account recovery via Clerk sign-in tokens.                │
│  Creates a magic link that lets user log in without password.              │
│                                                                            │
│  SID Rules Enforced:                                                       │
│  - SID-3.1: auth() does NOT appear here                                    │
│  - SID-9.1: Identity originates from readSessionCookie()                   │
│  - SID-12.1: Admin verification via FUSE cookie                            │
└────────────────────────────────────────────────────────────────────────────┘ */

'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

interface SendRecoveryLinkResult {
  success?: boolean;
  error?: string;
  magicLink?: string;
}

/**
 * Send a recovery link (magic link) to any email address for a user
 * Admin only - creates a Clerk sign-in token
 */
export async function sendRecoveryLink(
  userId: string,
  targetEmail: string
): Promise<SendRecoveryLinkResult> {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?._id) {
    return { error: 'Not authenticated' };
  }

  // Verify caller is admin (Admiral rank)
  if (session.rank !== 'admiral') {
    return { error: 'Admin access required' };
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!targetEmail || !emailRegex.test(targetEmail)) {
    return { error: 'Invalid email address' };
  }

  try {
    // Get the target user's clerkId from identity registry
    const clerkId = await convex.query(
      api.domains.admin.users.queries.getClerkIdForRecovery.getClerkIdForRecovery,
      {
        targetUserId: userId as Id<"admin_users">,
        callerUserId: session._id as Id<"admin_users">,
      }
    );

    if (!clerkId) {
      return { error: 'User not found or no Clerk identity' };
    }

    // Create Clerk sign-in token (magic link)
    const client = await clerkClient();
    const signInToken = await client.signInTokens.createSignInToken({
      userId: clerkId,
      expiresInSeconds: 86400, // 24 hours
    });

    // Build the magic link URL - points to /recovery page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const magicLink = `${appUrl}/recovery?__clerk_ticket=${signInToken.token}`;

    // TODO: Send email with magicLink to targetEmail
    // For now, return the link so admin can share it manually
    console.log(`🔗 Recovery link created for user ${userId}, sending to ${targetEmail}`);
    console.log(`🔗 Magic link: ${magicLink}`);

    return {
      success: true,
      magicLink, // Return for admin to copy/share
    };
  } catch (err) {
    console.error('Failed to create recovery link:', err);

    const clerkError = err as { errors?: Array<{ message?: string }> };
    if (clerkError.errors?.[0]?.message) {
      return { error: clerkError.errors[0].message };
    }

    return { error: 'Failed to create recovery link' };
  }
}
