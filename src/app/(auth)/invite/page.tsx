/**──────────────────────────────────────────────────────────────────────┐
│  🎟️ INVITE PAGE - Admin Magic Link Handler for New Users              │
│  /src/app/(auth)/invite/page.tsx                                      │
│                                                                       │
│  VR DOCTRINE: Page Layer (in auth boundary)                           │
│  - Handles __clerk_ticket from admin invite links                     │
│  - Creates new account via Clerk invitation                           │
│  - Shows password entry form for new user setup                       │
│                                                                       │
│  Flow:                                                                │
│  1. Admin sends invite link with ?__clerk_ticket=xxx                  │
│  2. New user clicks link → lands here                                 │
│  3. User enters password → account created → logged in                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp, useAuth } from '@clerk/nextjs';
import { Icon, Button, Spinner } from '@/vr';

export default function InvitePage() {
  const router = useRouter();
  const { isLoaded: signUpLoaded, signUp, setActive } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'loading' | 'password' | 'success' | 'error'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [ticketProcessed, setTicketProcessed] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Process the invitation ticket on mount
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    const processInvitation = async () => {
      if (ticketProcessed) return;
      if (!signUpLoaded || !authLoaded || !signUp) return;

      const searchParams = new URLSearchParams(window.location.search);
      const ticket = searchParams.get('__clerk_ticket');

      if (!ticket) {
        setError('No invitation ticket found. Please request a new invite link from your admin.');
        setStage('error');
        return;
      }

      // If already signed in, sign out first
      const alreadyTriedSignOut = searchParams.get('_retry') === '1';
      if (isSignedIn && !alreadyTriedSignOut) {
        await signOut();
        const url = new URL(window.location.href);
        url.searchParams.set('_retry', '1');
        window.location.href = url.toString();
        return;
      }

      try {
        // Start sign-up with the invitation ticket
        const result = await signUp.create({
          strategy: 'ticket',
          ticket,
        });

        setTicketProcessed(true);

        if (result.status === 'complete') {
          // Invitation accepted, account created
          if (result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
            router.push('/api/session');
            return;
          }
        } else if (result.status === 'missing_requirements') {
          // User needs to set password
          // Get email from the sign-up attempt
          setInviteEmail(result.emailAddress || '');
          setStage('password');
        } else {
          setError('Invitation could not be processed. Please request a new one.');
          setStage('error');
        }
      } catch (err) {
        console.error('Invitation processing error:', err);
        const errObj = err as { errors?: Array<{ code?: string; message?: string }> };
        const errCode = errObj?.errors?.[0]?.code;
        const message = errObj?.errors?.[0]?.message;

        if (errCode === 'ticket_expired' || message?.includes('expired')) {
          setError('This invitation link has expired. Please request a new one from your admin.');
        } else if (errCode === 'ticket_invalid' || message?.includes('invalid')) {
          setError('This invitation link is invalid. Please request a new one from your admin.');
        } else if (message?.includes('already been used') || message?.includes('already accepted')) {
          setError('This invitation has already been used. Each invite can only be used once.');
        } else if (message?.includes('already exists') || message?.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.');
        } else if (message) {
          setError(message);
        } else {
          setError('Failed to process invitation. Please try again.');
        }
        setStage('error');
      }
    };

    processInvitation();
  }, [signUpLoaded, authLoaded, signUp, setActive, isSignedIn, signOut, ticketProcessed, router]);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Complete sign-up with password
  // ═══════════════════════════════════════════════════════════════════

  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpLoaded || !signUp) return;

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      setError('Password must contain at least one special character');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Complete sign-up with password
      const result = await signUp.update({
        password,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          // Redirect to session API to mint FUSE cookie
          router.push('/api/session');
          return;
        }
        setStage('success');
        setTimeout(() => {
          router.push('/sign-in');
        }, 3000);
      } else {
        setError('Failed to complete account setup. Please try again.');
      }
    } catch (err) {
      console.error('Sign-up completion error:', err);
      const errObj = err as { errors?: Array<{ message?: string }> };
      const message = errObj?.errors?.[0]?.message;
      setError(message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════

  if (stage === 'loading') {
    return (
      <>
        <div className="ft-auth-header">
          <h2 className="ft-auth-title">You&apos;ve Been Invited!</h2>
          <p className="ft-auth-subtitle">Verifying your invitation...</p>
        </div>

        <div className="ft-auth-loading">
          <Spinner size="xl" color="brand" />
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════════════

  if (stage === 'error') {
    return (
      <>
        <div className="ft-auth-header">
          <h2 className="ft-auth-title">Invitation Failed</h2>
          <p className="ft-auth-subtitle">We couldn&apos;t process your invitation</p>
        </div>

        <div className="ft-auth-error">
          <p className="ft-auth-error-text">{error}</p>
        </div>

        <div className="ft-auth-footer-inline">
          <a href="/sign-in" className="ft-auth-link">
            ← Go to sign in
          </a>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUCCESS STATE
  // ═══════════════════════════════════════════════════════════════════

  if (stage === 'success') {
    return (
      <>
        <div className="ft-auth-header">
          <h2 className="ft-auth-title">Account Created!</h2>
          <p className="ft-auth-subtitle">Welcome to the platform</p>
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
  // PASSWORD FORM
  // ═══════════════════════════════════════════════════════════════════

  return (
    <>
      <div className="ft-auth-header">
        <h2 className="ft-auth-title">Welcome In!</h2>
        <p className="ft-auth-subtitle">
          {inviteEmail
            ? <>Set a password and come on in. Your email is: <strong className="ft-auth-highlight">{inviteEmail}</strong></>
            : 'Set a password to complete your account setup'
          }
        </p>
      </div>

      <form onSubmit={handleCompleteSignUp} className="ft-auth-form">
        <div className="ft-auth-field">
          <label htmlFor="password" className="ft-auth-label">
            Create Password
          </label>
          <div className="ft-auth-input-wrapper">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          {isSubmitting ? 'Creating account...' : 'Create Account & Sign In'}
        </Button.fire>

        {/* Terms */}
        <p className="ft-auth-terms">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </form>

      {/* Sign In Link */}
      <div className="ft-auth-footer-inline">
        <p className="ft-auth-footer-text">
          Already have an account?{" "}
          <a href="/sign-in" className="ft-auth-footer-link">
            Sign in
          </a>
        </p>
      </div>
    </>
  );
}
