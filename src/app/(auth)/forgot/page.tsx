/**──────────────────────────────────────────────────────────────────────┐
│  🔐 FORGOT PASSWORD PAGE                                               │
│  /src/app/(auth)/forgot/page.tsx                                       │
│                                                                        │
│  VR DOCTRINE: Page Layer (in auth boundary)                            │
│  - Stage 1: Email form (inline)                                        │
│  - Stage 2: VerifyForgot feature (ONE LINE import)                     │
│  - Stage 3: Password form (inline)                                     │
│                                                                        │
│  Clerk hooks are legal here - this is the (auth) boundary.             │
│  Shell (logo, card, footer) is SSR via layout.tsx.                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { Icon, Button, Spinner } from '@/vr';
import { VerifyForgot } from '@/app/(clerk)/features/VerifyForgot';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 1: Send Reset Code
  // ═══════════════════════════════════════════════════════════════════

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    setError('');
    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      setStage('code');
      setIsSubmitting(false);
    } catch (err) {
      const errObj = err as { errors?: Array<{ code?: string; message?: string }> };
      const errCode = errObj?.errors?.[0]?.code;
      const message = errObj?.errors?.[0]?.message;

      if (errCode === 'form_identifier_not_found' || errCode === 'identifier_not_found') {
        setError("Couldn't find your account.");
      } else if (message) {
        setError(message);
      } else {
        setError("We couldn't send a reset code. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // STAGE 3: Reset Password
  // ═══════════════════════════════════════════════════════════════════

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) return;

    // Validation
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setError('Password must contain at least one special character');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          router.push('/api/session');
          return;
        } else {
          setStage('success');
          setTimeout(() => {
            router.push('/sign-in');
          }, 3000);
          setIsSubmitting(false);
        }
      } else {
        setError('Failed to reset password. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Password reset error:', err);
      const errObj = err as { errors?: Array<{ message?: string }> };
      const message = errObj?.errors?.[0]?.message;
      if (message) {
        setError(String(message));
      } else {
        setError('Failed to reset password. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════

  if (stage === 'success') {
    return (
      <>
        <div className="ft-auth-header">
          <h2 className="ft-auth-title">Password Reset Complete</h2>
          <p className="ft-auth-subtitle">Your password has been successfully reset</p>
        </div>

        <div className="ft-auth-success">
          <div className="ft-auth-success-icon">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <p className="ft-auth-success-message">Redirecting you to sign in...</p>

          <div className="ft-auth-progress-bar">
            <div className="ft-auth-progress-track">
              <div className="ft-auth-progress-fill"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <>
      {/* Header - Hidden during code stage (VerifyForgot owns the UI) */}
      {stage !== 'code' && (
        <div className="ft-auth-header">
          <h2 className="ft-auth-title">
            {stage === 'password' ? 'Reset Password' : 'Forgot Password?'}
          </h2>
          <p className="ft-auth-subtitle">
            {stage === 'email' &&
              'Enter your email. If you have an account with us you will receive a 6-digit code. Retrieve it and return here.'}
            {stage === 'password' && 'Enter your new password'}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STAGE 1: Email Form
          ═══════════════════════════════════════════════════════════════ */}
      {stage === 'email' && (
        <form onSubmit={handleSendCode} className="ft-auth-form">
          <div className="ft-auth-field">
            <label htmlFor="email" className="ft-auth-label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="ft-auth-input"
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <div className="ft-auth-error">
              <p className="ft-auth-error-text">{error}</p>
            </div>
          )}

          <Button.fire
            type="submit"
            disabled={isSubmitting}
            icon={isSubmitting ? <Spinner size="xs" color="white" /> : undefined}
            iconPosition="left"
            fullWidth
          >
            {isSubmitting ? 'Sending code...' : 'Send Reset Code'}
          </Button.fire>
        </form>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STAGE 2: Verification - ONE LINE IMPORT
          ═══════════════════════════════════════════════════════════════ */}
      <VerifyForgot
        isOpen={stage === 'code'}
        email={email}
        onSuccess={() => setStage('password')}
        onCancel={() => {
          setStage('email');
          setError('');
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          STAGE 3: New Password Form
          ═══════════════════════════════════════════════════════════════ */}
      {stage === 'password' && (
        <form onSubmit={handleResetPassword} className="ft-auth-form">
          <div className="ft-auth-field">
            <label htmlFor="newPassword" className="ft-auth-label">
              New Password
            </label>
            <div className="ft-auth-input-wrapper">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                className="ft-auth-input ft-auth-input-with-icon"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ft-auth-input-icon-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <Icon variant={showPassword ? 'eye-off' : 'eye'} size="sm" />
              </button>
            </div>
            <p className="ft-auth-help-text">Must have: 6+ characters, 1 uppercase, 1 number, 1 symbol</p>
          </div>

          {error && (
            <div className="ft-auth-error">
              <p className="ft-auth-error-text">{error}</p>
            </div>
          )}

          <Button.fire
            type="submit"
            disabled={isSubmitting}
            icon={isSubmitting ? <Spinner size="xs" color="white" /> : undefined}
            iconPosition="left"
            fullWidth
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button.fire>
        </form>
      )}

      {/* Back to Sign In */}
      <div className="ft-auth-footer-inline">
        <a href="/sign-in" className="ft-auth-link">
          <p>← Back to sign in</p>
        </a>
      </div>
    </>
  );
}
