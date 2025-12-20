/**──────────────────────────────────────────────────────────────────────┐
│  🔐 VERIFY FORGOT - Password Reset Code Verification                  │
│  /src/features/verify/VerifyForgot/index.tsx                          │
│                                                                        │
│  VR DOCTRINE: Feature Layer (Dirty Playground)                         │
│  - Has Clerk hooks (useSignIn)                                         │
│  - Has state (code, error, isLoading)                                  │
│  - Has handlers (handleVerify, handleResend)                           │
│  - Returns Modal.verify VR                                             │
│                                                                        │
│  Used by: forgot/page.tsx between email and password stages            │
│  Flow: Enter email (page) → verify code (this) → new password (page)   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { Modal } from '@/prebuilts/modal';

export interface VerifyForgotProps {
  /** Control visibility */
  isOpen: boolean;
  /** Email address (for display) */
  email: string;
  /** Called when verification succeeds (move to password stage) */
  onSuccess: () => void;
  /** Called when user cancels (back to email stage) */
  onCancel: () => void;
}

/**
 * VerifyForgot - Password reset code verification
 *
 * This feature handles ONLY the verification step of forgot password:
 * 1. User enters 6-digit code from email
 * 2. Clerk validates via attemptFirstFactor
 * 3. On success, calls onSuccess (page moves to password stage)
 *
 * The email form and password form live in the page.
 */
export function VerifyForgot({
  isOpen,
  email,
  onSuccess,
  onCancel,
}: VerifyForgotProps) {
  // ═══════════════════════════════════════════════════════════════════
  // 🛡️ CLERK HOOKS - LEGAL IN VERIFY FEATURES (features/verify/*)
  // ═══════════════════════════════════════════════════════════════════
  const { isLoaded, signIn } = useSignIn();

  // State
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeAttempted, setCodeAttempted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode('');
      setError('');
      setIsLoading(false);
      setIsResending(false);
      setCodeAttempted(false);
    }
  }, [isOpen]);

  // ═══════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  const handleVerify = useCallback(async () => {
    if (!isLoaded || !signIn || code.length !== 6) return;

    setError('');
    setIsLoading(true);
    setCodeAttempted(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        setIsLoading(false);
        onSuccess();
      } else {
        setError('Invalid code. Please try again.');
        setCode('');
        setCodeAttempted(false);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Code verification error:', err);
      const errObj = err as { errors?: Array<{ code?: string; message?: string }> };
      const errCode = errObj?.errors?.[0]?.code;
      const message = errObj?.errors?.[0]?.message;

      if (errCode === 'too_many_requests' || String(message).toLowerCase().includes('too many')) {
        setError('Too many attempts. Please wait a moment and try again.');
      } else if (errCode === 'form_code_incorrect' || String(message).toLowerCase().includes('incorrect')) {
        setError('Incorrect code. Please check and try again.');
      } else {
        setError('Invalid code. Please try again.');
      }

      setCode('');
      setCodeAttempted(false);
      setIsLoading(false);
    }
  }, [isLoaded, signIn, code, onSuccess]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isLoading && isOpen && !codeAttempted) {
      handleVerify();
    }
  }, [code, handleVerify, isLoading, isOpen, codeAttempted]);

  const handleResend = async () => {
    if (!isLoaded || !signIn || isResending) return;

    setIsResending(true);
    setError('');
    setCode('');
    setCodeAttempted(false);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setTimeout(() => {
        setIsResending(false);
      }, 2000);
    } catch (err) {
      const errObj = err as { errors?: Array<{ message?: string }> };
      const message = errObj?.errors?.[0]?.message;
      if (message) {
        setError(String(message));
      } else {
        setError('Failed to resend code. Please try again.');
      }
      setIsResending(false);
    }
  };

  const handleCancel = () => {
    setCode('');
    setError('');
    onCancel();
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER - Modal.verify VR (inline variant for forgot password flow)
  // ═══════════════════════════════════════════════════════════════════

  return (
    <Modal.verify
      variant="inline"
      isOpen={isOpen}
      email={email}
      code={code}
      error={error}
      isLoading={isLoading}
      isResending={isResending}
      heading="Verification Code"
      description="Check your inbox for the 6-digit code"
      submitText="Verify Code"
      cancelText="← Try a different email"
      resendSuccessText="Code sent! Check your inbox"
      onCodeChange={setCode}
      onSubmit={handleVerify}
      onResend={handleResend}
      onCancel={handleCancel}
      onClose={handleCancel}
    />
  );
}

export default VerifyForgot;
