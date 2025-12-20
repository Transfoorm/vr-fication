/**─────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Verify Modal                                      │
│  /src/prebuilts/modal/Verify.tsx                                      │
│                                                                       │
│  Universal 6-digit code verification UI.                              │
│  Used for: password reset, email verification, 2FA, etc.              │
│                                                                       │
│  VR DOCTRINE: This is a DUMB SHELL.                                   │
│  - NO Clerk hooks                                                     │
│  - NO FUSE store                                                      │
│  - NO server actions                                                  │
│  - All text comes from props                                          │
│  - All actions emit callbacks                                         │
│                                                                       │
│  Usage:                                                               │
│    import { Modal } from '@/prebuilts';                               │
│    <Modal.verify                                                      │
│      variant="modal"                                                  │
│      isOpen={true}                                                    │
│      email="user@example.com"                                         │
│      code={code}                                                      │
│      heading="Verify Your Email"                                      │
│      description="Enter the 6-digit code"                             │
│      onCodeChange={setCode}                                           │
│      onSubmit={handleVerify}                                          │
│      onResend={handleResend}                                          │
│      onCancel={handleCancel}                                          │
│      onClose={handleClose}                                            │
│    />                                                                 │
└───────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/prebuilts/button';
import { T } from '@/prebuilts/typography';
import { Spinner } from '@/prebuilts/icon/Spinner';

export interface VerifyModalProps {
  // Control
  isOpen: boolean;

  // Variant (container type)
  variant?: 'modal' | 'inline';

  // Visual States
  isPreparing?: boolean;
  isLoading?: boolean;
  isResending?: boolean;
  showSuccess?: boolean;

  // Core Content
  email: string;
  code: string;
  error?: string;

  // Customizable Text (Features provide these)
  heading: string;
  description: string;
  submitText?: string;
  cancelText?: string;
  resendText?: string;
  resendSuccessText?: string;

  // Success State Text
  successHeading?: string;
  successDescription?: string;
  successProgressText?: string;

  // Preparing State Text
  preparingText?: string;

  // Callbacks
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onCancel: () => void;
  onClose: () => void;

  // Optional: Show logo
  showLogo?: boolean;
}

/**
 * VerifyModal - Universal 6-digit code verification UI
 *
 * Features:
 * - 6 individual code inputs with keyboard navigation
 * - Auto-advance on digit entry
 * - Backspace moves to previous cell
 * - Paste support (extracts digits)
 * - Auto-submit when 6 digits entered
 * - Preparing state (spinner + message)
 * - Success state (icon + progress bar)
 * - Resend code functionality
 * - Error display
 *
 * Variants:
 * - modal: Fixed overlay with backdrop (default)
 * - inline: Embedded card without overlay
 */
export default function VerifyModal({
  isOpen,
  variant = 'modal',
  isPreparing = false,
  isLoading = false,
  isResending = false,
  showSuccess = false,
  email,
  code,
  error,
  heading,
  description,
  submitText = 'Verify',
  cancelText = 'Cancel',
  resendText = 'Resend Code',
  resendSuccessText = 'Code sent!',
  successHeading = 'Verified!',
  successDescription = 'Verification successful',
  successProgressText = 'Completing...',
  preparingText = 'Sending code...',
  onCodeChange,
  onSubmit,
  onResend,
  onCancel,
  onClose,
  showLogo = false,
}: VerifyModalProps) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens or preparing ends
  useEffect(() => {
    if (isOpen && !isPreparing && !showSuccess && firstInputRef.current) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen, isPreparing, showSuccess]);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !isLoading && !isPreparing && !showSuccess) {
      onSubmit();
    }
  }, [code, isLoading, isPreparing, showSuccess, onSubmit]);

  // Handle escape key (modal variant only)
  useEffect(() => {
    if (variant !== 'modal') return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, variant]);

  if (!isOpen) return null;

  // Handle code input keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const key = e.key;

    // Handle digit input
    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      const newCode = code.split('');
      newCode[index] = key;
      const updatedCode = newCode.join('');
      onCodeChange(updatedCode);

      // Advance to next cell
      if (index < 5) {
        const nextInput = e.currentTarget.parentElement?.children[index + 1] as HTMLInputElement;
        nextInput?.focus();
      }
    }

    // Handle backspace
    if (key === 'Backspace') {
      e.preventDefault();
      const newCode = code.split('');
      if (code[index]) {
        newCode[index] = '';
        onCodeChange(newCode.join(''));
      } else if (index > 0) {
        newCode[index - 1] = '';
        onCodeChange(newCode.join(''));
        const prevInput = e.currentTarget.parentElement?.children[index - 1] as HTMLInputElement;
        prevInput?.focus();
      }
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onCodeChange(pastedData);

    const targetIndex = Math.min(pastedData.length, 5);
    const targetInput = e.currentTarget.parentElement?.children[targetIndex] as HTMLInputElement;
    targetInput?.focus();
  };

  // Success Icon SVG
  const successIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  // Spinner VR - small for buttons, large for preparing state
  const spinnerSmall = <Spinner size="sm" color="white" />;
  const spinnerLarge = <Spinner size="xl" color="brand" />;

  // Success View
  const successView = (
    <div className="vr-modal-verify-success">
      <div className="vr-modal-verify-success-icon">
        {successIcon}
      </div>
      <T.h2 className="vr-modal-verify-heading">{successHeading}</T.h2>
      <T.body className="vr-modal-verify-description">{successDescription}</T.body>
      <div className="vr-modal-verify-progress">
        <div className="vr-modal-verify-progress-track">
          <div className="vr-modal-verify-progress-fill" />
        </div>
        <T.body className="vr-modal-verify-progress-text">{successProgressText}</T.body>
      </div>
    </div>
  );

  // Preparing View
  const preparingView = (
    <div className="vr-modal-verify-preparing">
      {spinnerLarge}
      <T.body className="vr-modal-verify-preparing-text">{preparingText}</T.body>
    </div>
  );

  // Code Input View
  const codeInputView = (
    <div className="vr-modal-verify-form">
      <T.h2 className="vr-modal-verify-heading">{heading}</T.h2>
      <T.body className="vr-modal-verify-description">{description}</T.body>

      {/* 6-digit code inputs */}
      <div className="vr-modal-verify-code-inputs">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            ref={index === 0 ? firstInputRef : null}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={code[index] || ''}
            onFocus={(e) => e.target.select()}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onChange={() => {/* Handled by onKeyDown */}}
            onPaste={handlePaste}
            className="vr-modal-verify-code-input"
            disabled={isLoading}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {/* Email confirmation */}
      <T.body className="vr-modal-verify-email-hint">
        Code sent to <strong>{email}</strong>
      </T.body>

      {/* Error */}
      {error && (
        <div className="vr-modal-verify-error">
          <T.body color="error" className="vr-modal-verify-error-text">{error}</T.body>
        </div>
      )}

      {/* Submit button */}
      <Button.fire
        onClick={onSubmit}
        disabled={isLoading || code.length !== 6}
        fullWidth
      >
        {isLoading ? (
          <span className="vr-modal-verify-button-content">
            {spinnerSmall}
            <span>Verifying...</span>
          </span>
        ) : (
          submitText
        )}
      </Button.fire>

      {/* Resend */}
      <div className="vr-modal-verify-resend">
        {isResending ? (
          <span className="vr-modal-verify-resend-success">{resendSuccessText}</span>
        ) : (
          <>
            <span className="vr-modal-verify-resend-text">Didn&apos;t receive the code? </span>
            <button
              type="button"
              onClick={onResend}
              className="vr-modal-verify-resend-button"
            >
              {resendText}
            </button>
          </>
        )}
      </div>

      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        className="vr-modal-verify-cancel-button"
      >
        {cancelText}
      </button>
    </div>
  );

  // Determine which view to show
  const content = showSuccess ? successView : isPreparing ? preparingView : codeInputView;

  // Inline variant - no portal, no overlay
  if (variant === 'inline') {
    return (
      <div className="vr-modal-verify vr-modal-verify--inline">
        {showLogo && (
          <div className="vr-modal-verify-logo">
            {/* Logo slot - features can pass via children or we use default */}
          </div>
        )}
        {content}
      </div>
    );
  }

  // Modal variant - portal with overlay
  if (typeof document === 'undefined') return null;

  const modalContent = (
    <div className="vr-modal-verify-overlay" onClick={onClose}>
      <div
        className="vr-modal-verify vr-modal-verify--modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {showLogo && (
          <div className="vr-modal-verify-logo">
            {/* Logo slot */}
          </div>
        )}
        {content}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
