/**
 * 🛡️ S.I.D. COMPLIANT Email Actions
 * Purpose: Add/remove emails via Clerk Backend API 
 * SPECIAL CASE per SID-12.1:
 * These actions call Clerk API for email management.
 * Identity is sourced from session.clerkId (FUSE cookie), NOT auth().
 *
 * SID Rules Enforced:
 * - SID-3.1: auth() does NOT appear here
 * - SID-12.1: Email actions use session.clerkId from FUSE cookie
 * - SID-9.1: Identity originates from readSessionCookie()
 *
 * REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
 */

'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { readSessionCookie } from '@/fuse/hydration/session/cookie';

/**
 * Add a new email to user's account and send verification code
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function addEmailAndSendCode(newEmail: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();

    // Create email address via Backend API (no reverification needed)
    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    const emailAddress = await client.emailAddresses.createEmailAddress({
      userId: session.clerkId,
      emailAddress: newEmail,
      verified: false,
    });

    // The email address is created - now we need to trigger verification
    // Backend API doesn't have prepareVerification, so we return the ID
    // and let the client call prepareVerification on it
    return {
      success: true,
      emailAddressId: emailAddress.id,
    };
  } catch (err) {
    console.error('Failed to add email:', err);

    // Extract detailed error from Clerk
    const error = err as {
      errors?: Array<{ message: string; code?: string; longMessage?: string }>;
      clerkError?: boolean;
      status?: number;
    };

    // Log full error details for debugging
    if (error?.errors) {
      console.error('Clerk error details:', JSON.stringify(error.errors, null, 2));
    }

    if (error?.errors?.[0]?.message) {
      const errorMessage = error.errors[0].longMessage || error.errors[0].message;
      return { error: errorMessage };
    }
    return { error: 'Failed to add email address' };
  }
}

/**
 * Set an email address as primary and delete the old primary
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function setPrimaryEmail(emailAddressId: string, oldEmailId?: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();

    // Set new email as primary
    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    await client.users.updateUser(session.clerkId, {
      primaryEmailAddressID: emailAddressId,
    });

    // Delete the old primary email (cleanup)
    if (oldEmailId) {
      try {
        await client.emailAddresses.deleteEmailAddress(oldEmailId);
      } catch {
        // Silent failure - old email might already be deleted
        console.warn('Could not delete old email:', oldEmailId);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to set primary email:', err);
    return { error: 'Failed to update primary email' };
  }
}

/**
 * Swap secondary email to become primary (both must be verified)
 * Old primary becomes the new secondary
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 *
 * @param secondaryEmail - The email address string to make primary
 */
export async function swapEmailsToPrimary(secondaryEmail: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();

    // Get user to find the email address ID (case-insensitive)
    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    const clerkUser = await client.users.getUser(session.clerkId);
    const emailObj = clerkUser.emailAddresses.find(
      e => e.emailAddress.toLowerCase() === secondaryEmail.toLowerCase()
    );

    if (!emailObj) {
      return { error: 'Secondary email not found in Clerk' };
    }

    if (emailObj.verification?.status !== 'verified') {
      return { error: 'Secondary email must be verified first' };
    }

    // Set the secondary email as primary
    // Clerk keeps the old primary as a secondary email automatically
    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    await client.users.updateUser(session.clerkId, {
      primaryEmailAddressID: emailObj.id,
    });

    return { success: true };
  } catch (err) {
    console.error('Failed to swap emails:', err);
    return { error: 'Failed to swap emails' };
  }
}

/**
 * Ensure a specific email stays as primary (prevents auto-promotion of newly verified emails)
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 *
 * @param primaryEmail - The email address string that MUST remain primary
 */
export async function ensurePrimaryEmail(primaryEmail: string) {
  const session = await readSessionCookie();

  console.log('[ensurePrimaryEmail] Starting for:', primaryEmail);
  console.log('[ensurePrimaryEmail] Session clerkId:', session?.clerkId ? 'present' : 'MISSING');

  if (!session?.clerkId) {
    console.error('[ensurePrimaryEmail] No clerkId in session');
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();
    console.log('[ensurePrimaryEmail] Got Clerk client, fetching user...');

    const clerkUser = await client.users.getUser(session.clerkId);
    console.log('[ensurePrimaryEmail] User has', clerkUser.emailAddresses.length, 'email addresses');
    console.log('[ensurePrimaryEmail] Current primary:', clerkUser.primaryEmailAddress?.emailAddress);

    // Find the email that should be primary
    const targetEmail = clerkUser.emailAddresses.find(
      (e) => e.emailAddress.toLowerCase() === primaryEmail.toLowerCase()
    );

    if (!targetEmail) {
      console.error('[ensurePrimaryEmail] Target email not found:', primaryEmail);
      console.error('[ensurePrimaryEmail] Available emails:', clerkUser.emailAddresses.map(e => e.emailAddress));
      return { error: 'Primary email not found in Clerk' };
    }

    // If it's already primary, nothing to do
    if (clerkUser.primaryEmailAddressId === targetEmail.id) {
      console.log('[ensurePrimaryEmail] Already primary, no action needed');
      return { success: true, alreadyPrimary: true };
    }

    // CRITICAL: Check if the target email is verified
    // Clerk won't allow setting an unverified email as primary
    // If the original primary was unverified and a new email got verified,
    // Clerk auto-promotes the verified one - we should let that stand
    if (targetEmail.verification?.status !== 'verified') {
      console.log('[ensurePrimaryEmail] Target email is UNVERIFIED - letting Clerk auto-promotion stand');
      console.log('[ensurePrimaryEmail] Current primary is now:', clerkUser.primaryEmailAddress?.emailAddress);
      return {
        success: true,
        skipped: true,
        reason: 'Original primary was unverified, Clerk auto-promoted the verified email',
        newPrimary: clerkUser.primaryEmailAddress?.emailAddress,
      };
    }

    // Set it back as primary
    console.log('[ensurePrimaryEmail] Restoring primary to:', targetEmail.emailAddress);
    await client.users.updateUser(session.clerkId, {
      primaryEmailAddressID: targetEmail.id,
    });

    console.log('[ensurePrimaryEmail] Successfully restored primary');
    return { success: true, restored: true };
  } catch (err) {
    const error = err as { message?: string; errors?: Array<{ message: string; code?: string }> };
    console.error('[ensurePrimaryEmail] CAUGHT ERROR:', err);
    console.error('[ensurePrimaryEmail] Error message:', error.message);
    console.error('[ensurePrimaryEmail] Error details:', JSON.stringify(error.errors, null, 2));
    return { error: error.errors?.[0]?.message || error.message || 'Failed to restore primary email' };
  }
}

/**
 * Delete secondary email by email address string
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function deleteSecondaryEmail(secondaryEmail: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();

    // Get user to find the email address ID (case-insensitive)
    // 🛡️ SID-12.1: Using session.clerkId for Clerk API
    const clerkUser = await client.users.getUser(session.clerkId);
    const emailObj = clerkUser.emailAddresses.find(
      e => e.emailAddress.toLowerCase() === secondaryEmail.toLowerCase()
    );

    if (!emailObj) {
      return { error: 'Secondary email not found in Clerk' };
    }

    // Don't allow deleting primary email
    if (emailObj.id === clerkUser.primaryEmailAddressId) {
      return { error: 'Cannot delete primary email' };
    }

    await client.emailAddresses.deleteEmailAddress(emailObj.id);
    return { success: true };
  } catch (err) {
    console.error('Failed to delete secondary email:', err);
    return { error: 'Failed to delete email' };
  }
}

/**
 * Delete an email address (for cleanup when changing secondary)
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function deleteEmail(emailAddressId: string) {
  // 🛡️ SID-9.1: Identity from FUSE cookie
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();
    await client.emailAddresses.deleteEmailAddress(emailAddressId);
    return { success: true };
  } catch (err) {
    console.error('Failed to delete email:', err);
    return { error: 'Failed to delete email address' };
  }
}

/**
 * Clean up all unverified secondary emails
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function cleanupUnverifiedEmails() {
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(session.clerkId);

    const unverifiedEmails = clerkUser.emailAddresses.filter(
      (e) =>
        e.id !== clerkUser.primaryEmailAddressId &&
        e.verification?.status !== 'verified'
    );

    const deleted = [];
    for (const email of unverifiedEmails) {
      try {
        await client.emailAddresses.deleteEmailAddress(email.id);
        deleted.push(email.emailAddress);
      } catch (err) {
        console.warn('Failed to delete unverified email:', email.emailAddress, err);
      }
    }

    return {
      success: true,
      deleted,
      message: `Cleaned up ${deleted.length} unverified email(s)`
    };
  } catch (err) {
    console.error('Failed to cleanup emails:', err);
    return { error: 'Failed to cleanup unverified emails' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛡️ S.I.D. PHASE 12: EMAIL VERIFICATION SERVER ACTIONS
// These actions replace direct Clerk hook usage in Features zone
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if user's primary email is verified
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function checkPrimaryEmailVerified() {
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated', verified: false };
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(session.clerkId);
    const primaryEmail = clerkUser.primaryEmailAddress;

    if (!primaryEmail) {
      return { error: 'No primary email found', verified: false };
    }

    return {
      verified: primaryEmail.verification?.status === 'verified',
      email: primaryEmail.emailAddress,
    };
  } catch (err) {
    console.error('Failed to check email verification:', err);
    return { error: 'Failed to check verification status', verified: false };
  }
}

/**
 * Send verification code to primary email
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 *
 * NOTE: Clerk Backend API doesn't support prepareVerification directly.
 * We must use a workaround: create a magic link or use frontend SDK.
 * For now, returns emailId so frontend can call prepareVerification on it.
 */
export async function preparePrimaryEmailVerification() {
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(session.clerkId);
    const primaryEmail = clerkUser.primaryEmailAddress;

    if (!primaryEmail) {
      return { error: 'No primary email found' };
    }

    if (primaryEmail.verification?.status === 'verified') {
      return { alreadyVerified: true, email: primaryEmail.emailAddress };
    }

    // Return email info for frontend to initiate verification
    // Clerk Backend API can't call prepareVerification - that's a frontend SDK method
    return {
      success: true,
      emailId: primaryEmail.id,
      email: primaryEmail.emailAddress,
      needsClientVerification: true,
    };
  } catch (err) {
    console.error('Failed to prepare verification:', err);
    return { error: 'Failed to prepare verification' };
  }
}

/**
 * Get email verification status for a specific email
 * 🛡️ SID-12.1: Uses session.clerkId for Clerk API calls
 */
export async function getEmailVerificationStatus(emailId: string) {
  const session = await readSessionCookie();
  if (!session?.clerkId) {
    return { error: 'Not authenticated' };
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(session.clerkId);
    const email = clerkUser.emailAddresses.find(e => e.id === emailId);

    if (!email) {
      return { error: 'Email not found' };
    }

    return {
      verified: email.verification?.status === 'verified',
      status: email.verification?.status,
      email: email.emailAddress,
    };
  } catch (err) {
    console.error('Failed to get verification status:', err);
    return { error: 'Failed to check status' };
  }
}
