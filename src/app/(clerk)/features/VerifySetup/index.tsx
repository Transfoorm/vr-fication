/**──────────────────────────────────────────────────────────────────────┐
│  🔐 VERIFY SETUP - Email Verification for Onboarding                 │
│  /src/features/verify/VerifySetup/index.tsx                           │
│                                                                        │
│  VR DOCTRINE: Feature Layer (Dirty Playground)                         │
│  - Has Clerk hooks (useUser, useSignUp)                                │
│  - Has state (code, error, isLoading)                                  │
│  - Has handlers (handleVerify, handleResend)                           │
│  - Returns Modal.verify VR                                             │
│                                                                        │
│  Used by: SetupModal during onboarding to verify primary email         │
│  Flow: User signs up → email needs verification → this modal           │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useSignUp } from '@clerk/nextjs';
import { Modal } from '@/prebuilts/modal';

export interface VerifySetupProps {
  /** Control visibility */
  isOpen: boolean;
  /** Email to verify (display only) */
  email: string;
  /** Called when verification succeeds */
  onSuccess: () => void;
  /** Called when user closes/cancels */
  onClose: () => void;
}

/**
 * VerifySetup - Email verification for onboarding/setup
 *
 * This feature handles verifying an existing primary email.
 * Used during signup flow when email needs verification.
 *
 * Clerk flow:
 * 1. On open: prepareVerification({ strategy: 'email_code' })
 * 2. On submit: attemptVerification({ code })
 * 3. On success: call onSuccess callback
 */
export function VerifySetup({
  isOpen,
  email,
  onSuccess,
  onClose,
}: VerifySetupProps) {
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ CLERK HOOKS - LEGAL IN VERIFY FEATURES (features/verify/*)
  // ═══════════════════════════════════════════════════════════════════
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();

  // State
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [codeAttempted, setCodeAttempted] = useState(false);

  const isLoaded = userLoaded || signUpLoaded;

  // ═══════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  // Track if we've sent code for this modal session (prevents duplicate calls)
  const hasSentCodeRef = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset state
      setCode('');
      setError('');
      setIsLoading(false);
      setShowSuccess(false);
      setIsResending(false);
      setCodeAttempted(false);
      hasSentCodeRef.current = false; // Allow new code send
    }
  }, [isOpen]);

  // Send verification code once when ready
  useEffect(() => {
    if (!isOpen || hasSentCodeRef.current) return;
    if (!userLoaded && !signUpLoaded) return;

    // Mark as sent BEFORE calling to prevent race conditions
    hasSentCodeRef.current = true;

    const sendCode = async () => {
      setIsPreparing(true);
      try {
        // PRIORITY: If user is ALREADY signed in, use clerkUser (not signUp)
        // signUp APIs throw "You're already signed in" for authenticated users
        if (clerkUser?.primaryEmailAddress) {
          // Existing authenticated user verifying their email
          await clerkUser.primaryEmailAddress.prepareVerification({
            strategy: 'email_code',
          });
        } else if (signUp && signUp.status !== 'complete') {
          // New user registration (not yet signed in)
          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          });
        }
      } catch (err) {
        console.error('Failed to send verification code:', err);
        setError('Failed to send code. Click Resend to try again.');
      } finally {
        setIsPreparing(false);
      }
    };

    sendCode();
  }, [isOpen, userLoaded, signUpLoaded, clerkUser, signUp]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const handleVerify = async () => {
    if (!isLoaded || code.length !== 6) return;

    setError('');
    setIsLoading(true);
    setCodeAttempted(true);

    try {
      let isVerified = false;

      // PRIORITY: If user is ALREADY signed in, use clerkUser (not signUp)
      if (clerkUser?.primaryEmailAddress) {
        // Verify existing user's primary email
        const result = await clerkUser.primaryEmailAddress.attemptVerification({
          code,
        });
        isVerified =
          result.verification?.status === 'verified' ||
          ('status' in result && result.status === 'complete');
      } else if (signUp && signUp.status !== 'complete') {
        // Verify during signup flow (not yet signed in)
        const result = await signUp.attemptEmailAddressVerification({ code });
        // SignUpResource has 'verifications' (plural) and 'status'
        isVerified =
          result.verifications?.emailAddress?.status === 'verified' ||
          result.status === 'complete';
      } else {
        throw new Error('No verification method available');
      }

      if (isVerified) {
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
      setCode('');
      setCodeAttempted(false);
      setIsLoading(false);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isLoading && isOpen && !codeAttempted) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isLoading, isOpen, codeAttempted]);

  const handleResend = async () => {
    if (!isLoaded || isResending) return;

    setIsResending(true);
    setError('');
    setCode('');
    setCodeAttempted(false);

    try {
      // PRIORITY: If user is ALREADY signed in, use clerkUser (not signUp)
      if (clerkUser?.primaryEmailAddress) {
        await clerkUser.primaryEmailAddress.prepareVerification({
          strategy: 'email_code',
        });
      } else if (signUp && signUp.status !== 'complete') {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
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
  };

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
      heading="Verify Your Email"
      description="Check your inbox for a 6-digit code and return here"
      submitText="Verify Email"
      cancelText="Cancel"
      resendText="Resend Code"
      resendSuccessText="Code sent! Check again"
      successHeading="Email Verified!"
      successDescription="Your email has been successfully verified"
      successProgressText="Completing your setup..."
      preparingText="Sending verification code..."
      onCodeChange={setCode}
      onSubmit={handleVerify}
      onResend={handleResend}
      onCancel={onClose}
      onClose={onClose}
    />
  );
}

export default VerifySetup;
