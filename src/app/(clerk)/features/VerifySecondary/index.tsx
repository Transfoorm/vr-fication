/**──────────────────────────────────────────────────────────────────────┐
│  🔐 VERIFY SECONDARY - Add Secondary Email Verification               │
│  /src/features/verify/VerifySecondary/index.tsx                       │
│                                                                        │
│  VR DOCTRINE: Feature Layer (Dirty Playground)                         │
│  - Has Clerk hooks (useUser)                                           │
│  - Has state (code, error, isLoading, pendingEmailId)                  │
│  - Has handlers (handleVerify, handleResend)                           │
│  - Returns Modal.verify VR                                             │
│                                                                        │
│  Used by: EmailTab when adding secondary email                         │
│  Flow: User enters new email → verify → keep as secondary → delete old │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Modal } from '@/prebuilts/modal';
import { addEmailAndSendCode, deleteEmail } from '@/app/(clerk)/actions/email';

export interface VerifySecondaryProps {
  /** Control visibility */
  isOpen: boolean;
  /** New email to add and verify */
  email: string;
  /** Current secondary email (to delete after verification) */
  currentEmail?: string;
  /** Called when verification succeeds */
  onSuccess: () => void;
  /** Called when user closes/cancels */
  onClose: () => void;
}

/**
 * VerifySecondary - Add secondary email verification
 *
 * This feature handles adding a secondary email:
 * 1. Create new email via Server Action (bypasses reverification)
 * 2. Send verification code
 * 3. Verify the code
 * 4. Delete old secondary email (if any)
 *
 * Used when user wants to add/change their secondary email in Account Settings.
 */
export function VerifySecondary({
  isOpen,
  email,
  currentEmail,
  onSuccess,
  onClose,
}: VerifySecondaryProps) {
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

  // Guard to prevent duplicate preparation attempts
  const preparationAttemptedRef = useRef<string | null>(null);

  // ═══════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  // Reset state and prepare email when modal opens
  useEffect(() => {
    if (!isOpen) {
      // Reset guard when modal closes
      preparationAttemptedRef.current = null;
      return;
    }

    // Prevent duplicate preparation attempts for the same email
    if (preparationAttemptedRef.current === email) {
      return;
    }

    // Reset state
    setCode('');
    setError('');
    setIsLoading(false);
    setShowSuccess(false);
    setIsResending(false);
    setPendingEmailId(null);

    // Prepare secondary email
    const prepareSecondaryEmail = async () => {
      if (!clerkUser || !email) return;

      // CRITICAL: Don't run if already preparing
      if (isPreparing) {
        console.log('⚠️ Already preparing, skipping duplicate call');
        return;
      }

      // Mark this email as being prepared
      preparationAttemptedRef.current = email;

      setIsPreparing(true);
      setError('');

      try {
        // Step 0: Clean up any existing unverified secondary emails (not primary, not current secondary)
        try {
          await clerkUser.reload();
          const currentPrimary = clerkUser.primaryEmailAddress?.emailAddress;
          const unverifiedEmails = clerkUser.emailAddresses.filter(
            (e) =>
              e.emailAddress !== currentPrimary &&
              e.emailAddress !== currentEmail &&
              e.verification?.status !== 'verified'
          );

          // Delete ALL unverified emails, including the one we're trying to add
          // This ensures a clean slate for abandoned emails
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

        // If email already exists, try to find it and continue verification
        if (result.error) {
          // Reload user to check if email already exists in Clerk
          await clerkUser.reload();
          const existingEmail = clerkUser.emailAddresses.find(
            (e) => e.emailAddress === email
          );

          if (existingEmail) {
            // Email exists - use it for verification
            setPendingEmailId(existingEmail.id);

            // Send verification code to existing email
            try {
              await existingEmail.prepareVerification({ strategy: 'email_code' });
              setIsPreparing(false);
              return; // Continue to code input view
            } catch (err) {
              console.error('Failed to send verification to existing email:', err);
              const error = err as { status?: number; errors?: Array<{ message: string; code?: string }> };

              // Handle rate limiting (429)
              if (error.status === 429) {
                setError('Too many attempts. Please wait 2-3 minutes and try again.');
                setIsPreparing(false);
                return;
              }

              setError('Failed to send verification code');
              setIsPreparing(false);
              return;
            }
          }

          // Email doesn't exist and creation failed - show error
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
          try {
            await newEmailObj.prepareVerification({ strategy: 'email_code' });
            setIsPreparing(false);
          } catch (err) {
            console.error('Failed to send verification to newly created email:', err);
            const error = err as { status?: number; errors?: Array<{ message: string; code?: string }> };

            // Handle rate limiting (429)
            if (error.status === 429) {
              setError('Too many attempts. Please wait 2-3 minutes and try again.');
              setIsPreparing(false);
              return;
            }

            setError('Failed to send verification code');
            setIsPreparing(false);
            return;
          }
        } else {
          setIsPreparing(false);
        }
      } catch (err) {
        console.error('Failed to prepare secondary email:', err);
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
      prepareSecondaryEmail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isLoaded, email]);

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
        // Find the old secondary email's Clerk ID (for deletion)
        const oldEmailObj = currentEmail
          ? clerkUser.emailAddresses.find((e) => e.emailAddress === currentEmail)
          : null;
        const oldEmailClerkId = oldEmailObj?.id;

        // Delete old secondary email (if any)
        if (oldEmailClerkId) {
          await deleteEmail(oldEmailClerkId);
        }

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
      heading="Add Secondary Email"
      description="Check your inbox for a 6-digit code and return here"
      submitText="Verify & Add Email"
      cancelText="Cancel"
      resendText="Resend Code"
      resendSuccessText="Code sent! Check again"
      successHeading="Email Confirmed!"
      successDescription="Your secondary email has been verified successfully"
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

export default VerifySecondary;
