/**──────────────────────────────────────────────────────────────────────┐
│  🔐 RECOVERY PAGE - Admin Magic Link Handler                          │
│  /src/app/(auth)/recovery/page.tsx                                    │
│                                                                       │
│  VR DOCTRINE: Page Layer (in auth boundary)                           │
│  - Handles __clerk_ticket from admin recovery links                   │
│  - Authenticates via ticket (skips 6-digit code)                      │
│  - Shows password entry form directly                                 │
│                                                                       │
│  Flow:                                                                │
│  1. Admin sends recovery link with ?__clerk_ticket=xxx                │
│  2. User clicks link → lands here                                     │
│  3. Ticket authenticates them (proves identity)                       │
│  4. User enters new password → logged in                              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn, useAuth, useUser } from '@clerk/nextjs';
import { Icon, Button, Spinner } from '@/vr';

export default function RecoveryPage() {
  const router = useRouter();
  const { isLoaded: signInLoaded, signIn, setActive } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'loading' | 'password' | 'success' | 'error'>('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [useUserUpdate, setUseUserUpdate] = useState(false);
  const [ticketProcessed, setTicketProcessed] = useState(false);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Process the ticket on mount
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    const processTicket = async () => {
      // Skip if already processed
      if (ticketProcessed) return;

      // Wait for BOTH Clerk hooks to fully load
      if (!signInLoaded || !authLoaded || !signIn) return;

      const searchParams = new URLSearchParams(window.location.search);
      const ticket = searchParams.get('__clerk_ticket');

      if (!ticket) {
        setError('No recovery ticket found. Please request a new recovery link from your admin.');
        setStage('error');
        return;
      }

      // Check if we already tried signing out (prevent infinite loop)
      const alreadyTriedSignOut = searchParams.get('_retry') === '1';

      // If already signed in (before we processed ticket), sign out and reload
      if (isSignedIn && !alreadyTriedSignOut) {
        await signOut();
        // Add retry flag and reload
        const url = new URL(window.location.href);
        url.searchParams.set('_retry', '1');
        window.location.href = url.toString();
        return;
      }

      try {
        // Authenticate with the ticket - this proves their identity
        const result = await signIn.create({
          strategy: 'ticket',
          ticket,
        });

        if (result.status === 'complete') {
          // Mark as processed BEFORE setting active (prevents re-run)
          setTicketProcessed(true);

          // Ticket valid - user is authenticated, show password form
          // We need to set the session active first, then they can update password
          if (result.createdSessionId) {
            await setActive({ session: result.createdSessionId });
          }
          // Use user.updatePassword since we're now signed in
          setUseUserUpdate(true);
          setStage('password');
        } else if (result.status === 'needs_first_factor' || result.status === 'needs_second_factor') {
          // Ticket worked but needs additional auth - show password form anyway
          setStage('password');
        } else {
          setError('Recovery link could not be processed. Please request a new one.');
          setStage('error');
        }
      } catch (err) {
        console.error('Ticket processing error:', err);
        const errObj = err as { errors?: Array<{ code?: string; message?: string }> };
        const errCode = errObj?.errors?.[0]?.code;
        const message = errObj?.errors?.[0]?.message;

        if (errCode === 'ticket_expired') {
          setError('This recovery link has expired. Please request a new one from your admin.');
        } else if (errCode === 'ticket_invalid') {
          setError('This recovery link is invalid. Please request a new one from your admin.');
        } else if (message?.includes('already been used')) {
          setError('This recovery link has already been used. Each link can only be used once. Please request a new one from your admin.');
        } else if (message?.includes('already signed in') || message?.includes('session already exists') || message?.includes('Session already exists')) {
          // Sign out and reload with retry flag
          const alreadyTriedSignOut = new URLSearchParams(window.location.search).get('_retry') === '1';
          if (!alreadyTriedSignOut) {
            await signOut();
            const url = new URL(window.location.href);
            url.searchParams.set('_retry', '1');
            window.location.href = url.toString();
            return;
          }
          // If we already tried, show error
          setError('Unable to process recovery link. Please clear your browser data and try again.');
        } else if (message) {
          setError(message);
        } else {
          setError('Failed to process recovery link. Please try again.');
        }
        setStage('error');
      }
    };

    processTicket();
  }, [signInLoaded, authLoaded, signIn, setActive, isSignedIn, signOut, ticketProcessed]);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Set new password
  // ═══════════════════════════════════════════════════════════════════

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signInLoaded) return;

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
      // If signed in via ticket, use user.updatePassword
      if (useUserUpdate && user) {
        await user.updatePassword({
          newPassword,
        });
        // Already signed in, redirect to session API to mint FUSE cookie
        router.push('/api/session');
        return;
      }

      // Otherwise use signIn.resetPassword
      if (!signIn) return;

      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'complete') {
        if (result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          // Redirect to session API to mint FUSE cookie
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
        setError('Failed to set password. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Password set error:', err);
      const errObj = err as { errors?: Array<{ message?: string }> };
      const message = errObj?.errors?.[0]?.message;
      if (message) {
        setError(String(message));
      } else {
        setError('Failed to set password. Please try again.');
      }
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
          <h2 className="ft-auth-title">Account Recovery</h2>
          <p className="ft-auth-subtitle">Verifying your recovery link...</p>
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
          <h2 className="ft-auth-title">Recovery Failed</h2>
          <p className="ft-auth-subtitle">We couldn&apos;t process your recovery link</p>
        </div>

        <div className="ft-auth-error">
          <p className="ft-auth-error-text">{error}</p>
        </div>

        <div className="ft-auth-footer-inline">
          <a href="/sign-in" className="ft-auth-link">
            ← Back to sign in
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
          <h2 className="ft-auth-title">Password Set Successfully</h2>
          <p className="ft-auth-subtitle">Your account has been recovered</p>
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
        <h2 className="ft-auth-title">Set New Password</h2>
        <p className="ft-auth-subtitle">Your identity has been verified. Please set a new password.</p>
      </div>

      <form onSubmit={handleSetPassword} className="ft-auth-form">
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
          {isSubmitting ? 'Setting password...' : 'Set Password & Sign In'}
        </Button.fire>
      </form>

      <div className="ft-auth-footer-inline">
        <a href="/sign-in" className="ft-auth-link">
          ← Back to sign in
        </a>
      </div>
    </>
  );
}
