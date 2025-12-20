/**──────────────────────────────────────────────────────────────────────┐
│  🔐 VERIFY EMAIL - Change Primary Email Verification                  │
│  /src/features/verify/VerifyEmail/index.tsx                           │
│                                                                        │
│  VR DOCTRINE: Feature Layer (Dirty Playground)                         │
│  - Has Clerk hooks (useUser)                                           │
│  - Has state (code, error, isLoading, pendingEmailId)                  │
│  - Has handlers (handleVerify, handleResend)                           │
│  - Returns Modal.verify VR                                             │
│                                                                        │
│  Used by: EmailTab when changing primary email                         │
│  Flow: User enters new email → verify → set as primary → delete old    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Modal } from '@/vr/modal';
import { addEmailAndSendCode, setPrimaryEmail, deleteEmail } from '@/app/(clerk)/actions/email';

export interface VerifyEmailProps {
  /** Control visibility */
  isOpen: boolean;
  /** New email to add and verify */
  email: string;
  /** Current primary email (to delete after verification) */
  currentEmail?: string;
  /** Called when verification succeeds */
  onSuccess: () => void;
  /** Called when user closes/cancels */
  onClose: () => void;
}

/**
 * VerifyEmail - Change primary email verification
 *
 * This feature handles changing the primary email:
 * 1. Create new email via Server Action (bypasses reverification)
 * 2. Send verification code
 * 3. Verify the code
 * 4. Set as primary
 * 5. Delete old primary email
 *
 * Used when user wants to change their primary email in Account Settings.
 */
export function VerifyEmail({
  isOpen,
  email,
  currentEmail,
  onSuccess,
  onClose,
}: VerifyEmailProps) {
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ CLERK HOOKS - LEGAL IN VERIFY FEATURES (features/verify/*)
  // ═══════════════════════════════════════════════════════════════════
  const { user: clerkUser, isLoaded } = useUser();

  // State
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  // Reset state and prepare email when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Reset state
    setCode('');
    setError('');
    setIsLoading(false);
    setShowSuccess(false);
    setIsResending(false);
    setPendingEmailId(null);

    // Prepare email change
    const prepareEmailChange = async () => {
      if (!clerkUser || !email) return;

      setIsPreparing(true);
      setError('');

      try {
        // Step 0: Clean up any existing unverified emails (not primary, not current)
        try {
          await clerkUser.reload();
          const currentPrimary = clerkUser.primaryEmailAddress?.id;
          const unverifiedEmails = clerkUser.emailAddresses.filter(
            (e) =>
              e.id !== currentPrimary &&
              e.verification?.status !== 'verified'
          );

          // Delete ALL unverified emails to ensure a clean slate for abandoned emails
          for (const unverifiedEmail of unverifiedEmails) {
            try {
              console.log('🧹 Deleting existing unverified email:', unverifiedEmail.emailAddress);
              await deleteEmail(unverifiedEmail.id);
            } catch (err) {
              console.warn('⚠️ Failed to delete unverified email:', unverifiedEmail.emailAddress, err);
              // Continue anyway - not critical
            }
          }
        } catch (err) {
          console.error('Failed to clean up unverified emails:', err);
          // Continue anyway - not critical
        }

        // Step 1: Create email via Server Action (bypasses reverification)
        const result = await addEmailAndSendCode(email);
        if (result.error) {
          setError(result.error);
          setIsPreparing(false);
          return;
        }

        setPendingEmailId(result.emailAddressId!);

        // Step 2: Reload user to get the new email address object
        await clerkUser.reload();

        // Step 3: Find the email and send verification code
        const newEmailObj = clerkUser.emailAddresses.find(
          (e) => e.id === result.emailAddressId
        );
        if (newEmailObj) {
          await newEmailObj.prepareVerification({ strategy: 'email_code' });
        }

        setIsPreparing(false);
      } catch (err) {
        console.error('Failed to prepare email change:', err);
        const error = err as {
          errors?: Array<{ message: string; code?: string }>;
        };
        if (error?.errors?.[0]?.message) {
          const msg = error.errors[0].message;
          if (
            msg.toLowerCase().includes('already') ||
            error.errors[0].code === 'form_identifier_exists'
          ) {
            setError('This email is already in use');
          } else {
            setError(msg);
          }
        } else {
          setError('Failed to send verification code');
        }
        setIsPreparing(false);
      }
    };

    if (isLoaded && email) {
      prepareEmailChange();
    }
  }, [isOpen, isLoaded, clerkUser, email]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const handleVerify = useCallback(async () => {
    if (!isLoaded || !clerkUser || !pendingEmailId || code.length !== 6) return;

    setError('');
    setIsLoading(true);

    try {
      // Reload user to get fresh email state
      await clerkUser.reload();

      const pendingEmailObj = clerkUser.emailAddresses.find(
        (e) => e.id === pendingEmailId
      );
      if (!pendingEmailObj) {
        throw new Error('Pending email not found');
      }

      // Verify the code
      const result = await pendingEmailObj.attemptVerification({ code });
      const isVerified = result.verification?.status === 'verified';

      if (isVerified) {
        // Find the old email's Clerk ID (for deletion)
        const oldEmailObj = currentEmail
          ? clerkUser.emailAddresses.find((e) => e.emailAddress === currentEmail)
          : null;
        const oldEmailClerkId = oldEmailObj?.id;

        // Set as primary and delete old primary email
        await setPrimaryEmail(pendingEmailId, oldEmailClerkId);

        setIsLoading(false);
        setShowSuccess(true);

        // Delay callback for success animation
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError('Verification incomplete. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      const error = err as { errors?: Array<{ message: string }> };
      if (error?.errors?.[0]?.message) {
        const msg = error.errors[0].message.toLowerCase();
        if (msg.includes('expired') || msg.includes('expire')) {
          setError('Code expired - click "Resend Code"');
        } else if (msg.includes('incorrect') || msg.includes('invalid')) {
          setError('That code is incorrect, try again.');
        } else {
          setError(error.errors[0].message);
        }
      } else {
        setError('Invalid code. Please try again.');
      }
      setIsLoading(false);
    }
  }, [isLoaded, clerkUser, pendingEmailId, code, currentEmail, onSuccess]);

  const handleResend = useCallback(async () => {
    if (!isLoaded || !clerkUser || !pendingEmailId || isResending) return;

    setIsResending(true);
    setError('');
    setCode('');

    try {
      const pendingEmail = clerkUser.emailAddresses.find(
        (e) => e.id === pendingEmailId
      );
      if (pendingEmail) {
        await pendingEmail.prepareVerification({ strategy: 'email_code' });
      }

      // Show success feedback briefly
      setTimeout(() => {
        setIsResending(false);
      }, 2000);
    } catch (err) {
      const error = err as { errors?: Array<{ message: string }> };
      if (error?.errors?.[0]?.message) {
        setError(error.errors[0].message);
      } else {
        setError('Failed to resend code. Please try again.');
      }
      setIsResending(false);
    }
  }, [isLoaded, clerkUser, pendingEmailId, isResending]);

  const handleClose = useCallback(async () => {
    // Clean up unverified pending email - CRITICAL for abandoned email cleanup
    if (pendingEmailId && clerkUser) {
      try {
        await clerkUser.reload();
        const pendingEmail = clerkUser.emailAddresses.find(
          (e) => e.id === pendingEmailId
        );

        if (!pendingEmail) {
          // Email was already deleted (likely by preparation cleanup)
          console.log('✅ Abandoned email already cleaned up');
          onClose();
          return;
        }

        if (pendingEmail.verification?.status !== 'verified') {
          console.log('🧹 Cleaning up abandoned unverified email:', pendingEmail.emailAddress);
          // Use server action for reliable deletion
          const result = await deleteEmail(pendingEmailId);
          if (result.error) {
            console.warn('⚠️ Cleanup already handled:', result.error);
          } else {
            console.log('✅ Successfully deleted abandoned email');
          }
        }
      } catch (err) {
        console.error('❌ Error during abandoned email cleanup:', err);
      }
    }
    onClose();
  }, [pendingEmailId, clerkUser, onClose]);

  // ═══════════════════════════════════════════════════════════════════
  // RENDER - Modal.verify VR (dumb shell)
  // ═══════════════════════════════════════════════════════════════════

  return (
    <Modal.verify
      isOpen={isOpen}
      variant="modal"
      email={email}
      code={code}
      error={error}
      isPreparing={isPreparing}
      isLoading={isLoading}
      isResending={isResending}
      showSuccess={showSuccess}
      heading="Verify New Email"
      description="Check your inbox for a 6-digit code and return here"
      submitText="Verify & Update Email"
      cancelText="Cancel"
      resendText="Resend Code"
      resendSuccessText="Code sent! Check again"
      successHeading="Email Updated!"
      successDescription="Your primary email has been changed successfully"
      successProgressText="Updating your profile..."
      preparingText="Sending verification code..."
      onCodeChange={setCode}
      onSubmit={handleVerify}
      onResend={handleResend}
      onCancel={handleClose}
      onClose={handleClose}
    />
  );
}

export default VerifyEmail;
