/**─────────────────────────────────────────────────────────────────────────┐
│  🛡️ S.I.D. COMPLIANT Invite Actions                                       │
│  /src/app/(clerk)/actions/invite.ts                                       │
│                                                                           │
│  Admin-initiated user invitations via Clerk Invitations API.              │
│  Creates a magic link that lets NEW users create an account.              │
│                                                                           │
│  SID Rules Enforced:                                                      │
│  - SID-3.1: auth() does NOT appear here                                   │
│  - SID-9.1: Identity originates from readSessionCookie()                  │
│  - SID-12.1: Admin verification via FUSE cookie                           │
└───────────────────────────────────────────────────────────────────────────┘ */

'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';

interface SendInviteLinkResult {
  success?: boolean;
  error?: string;
  magicLink?: string;
}

/**
 * Send an invite link (magic link) to a new user's email
 * Admin only - creates a Clerk invitation
 */
export async function sendInviteLink(
  targetEmail: string
): Promise<SendInviteLinkResult> {
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
    const client = await clerkClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Clerk invitation for new user
    // ignoreExisting: true allows re-inviting if previous invite wasn't completed
    const invitation = await client.invitations.createInvitation({
      emailAddress: targetEmail,
      redirectUrl: `${appUrl}/invite`,
      ignoreExisting: true,
    });

    console.log(`🎟️ Clerk invitation response:`, JSON.stringify(invitation, null, 2));

    // Extract the ticket from Clerk's URL or use the invitation URL directly
    // Clerk returns a URL like: https://accounts.xxx.com/sign-up?__clerk_ticket=xxx
    let magicLink: string;

    if (invitation.url) {
      // Extract ticket from Clerk's URL and build our own
      const clerkUrl = new URL(invitation.url);
      const ticket = clerkUrl.searchParams.get('__clerk_ticket');
      if (ticket) {
        magicLink = `${appUrl}/invite?__clerk_ticket=${ticket}`;
      } else {
        // Fallback: use Clerk's URL directly
        magicLink = invitation.url;
      }
    } else {
      // Fallback if no URL - this shouldn't happen
      magicLink = `${appUrl}/invite?__clerk_ticket=${invitation.id}`;
    }

    console.log(`🎟️ Invite link created for ${targetEmail}`);
    console.log(`🎟️ Magic link: ${magicLink}`);

    return {
      success: true,
      magicLink,
    };
  } catch (err) {
    console.error('Failed to create invite link:', err);

    const clerkError = err as { errors?: Array<{ code?: string; message?: string }> };
    const errorCode = clerkError.errors?.[0]?.code;
    const errorMessage = clerkError.errors?.[0]?.message;

    // Handle specific Clerk errors
    if (errorCode === 'duplicate_record' || errorMessage?.includes('already exists')) {
      return { error: 'A user with this email already exists' };
    }

    if (errorMessage) {
      return { error: errorMessage };
    }

    return { error: 'Failed to create invite link' };
  }
}
