"use client";

/**──────────────────────────────────────────────────────────────────────┐
│  🔐 SIGN IN PAGE - TTT-CERTIFIED CLIENT FORM                           │
│  /src/app/(auth)/sign-in/page.tsx                                      │
│                                                                        │
│  CLIENT COMPONENT - Only the form logic.                               │
│  Shell (logo, card, footer) is SSR via layout.tsx.                     │
│                                                                        │
│  TTT Result:                                                           │
│  - Logo never disappears                                               │
│  - Card never collapses                                                │
│  - Form hydrates in place                                              │
│  - Zero layout shift                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { Icon, Button, Spinner } from '@/vr';

export default function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slowConnectionWarning, setSlowConnectionWarning] = useState(false);

  // Check for error query param on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const errorParam = searchParams.get('error');
    if (errorParam === 'session_failed') {
      setError("Session creation failed. Please try signing in again.");
    }
  }, []);

  // FUSE: Redirect to session API to mint cookie before loading dashboard (but not during active submission)
  useEffect(() => {
    if (isLoaded && isSignedIn && !isSubmitting) {
      router.push("/api/session");
    }
  }, [isLoaded, isSignedIn, isSubmitting, router]);

  // Timeout warning: Show message if authentication takes too long, then auto-refresh
  useEffect(() => {
    let warningTimeoutId: NodeJS.Timeout;
    let refreshTimeoutId: NodeJS.Timeout;

    if (isSubmitting) {
      warningTimeoutId = setTimeout(() => {
        setSlowConnectionWarning(true);
      }, 5000);

      refreshTimeoutId = setTimeout(() => {
        window.location.reload();
      }, 10000);
    } else {
      setSlowConnectionWarning(false);
    }

    return () => {
      clearTimeout(warningTimeoutId);
      clearTimeout(refreshTimeoutId);
    };
  }, [isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !signIn) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/api/session");
        return;
      } else {
        setError("Sign in failed. Please check your credentials.");
        setIsSubmitting(false);
      }
    } catch (err) {
      const code = err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]?.code;
      const message = err && typeof err === 'object' && 'errors' in err && Array.isArray(err.errors) && err.errors[0]?.message;

      if (code === 'form_identifier_not_found' || code === 'identifier_not_found') {
        setError("Couldn't find your account.");
      } else if (code === 'form_password_incorrect' || code === 'password_incorrect' || message?.includes("Password is incorrect")) {
        setError("Incorrect password. Please try again.");
      } else if (message) {
        setError("The authentication process needs you to refresh the page before trying again!");
      } else {
        setError("Failed to sign in. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="ft-auth-header">
        <h2 className="ft-auth-title">Welcome Back!</h2>
        <p className="ft-auth-subtitle">Enter your credentials and sign in</p>
      </div>

      <form onSubmit={handleSubmit} className="ft-auth-form">
        {/* Email Field */}
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

        {/* Password Field */}
        <div className="ft-auth-field">
          <label htmlFor="password" className="ft-auth-label">
            Password
          </label>
          <div className="ft-auth-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="ft-auth-input ft-auth-input-with-icon"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="ft-auth-input-icon-button"
            >
              <Icon variant={showPassword ? "eye-off" : "eye"} size="sm" />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="ft-auth-error">
            <p className="ft-auth-error-text">{error}</p>
          </div>
        )}

        {/* Slow Connection Warning */}
        {slowConnectionWarning && (
          <div className="ft-auth-warning">
            <p className="ft-auth-warning-text">
              This is taking longer than usual. Refreshing page in a few seconds...
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button.fire
          type="submit"
          disabled={isSubmitting}
          icon={isSubmitting ? <Spinner size="xs" color="white" /> : undefined}
          iconPosition="left"
          fullWidth
        >
          {isSubmitting ? "Authenticating..." : "Sign in"}
        </Button.fire>

        {/* Forgot Password Link */}
        <div className="ft-auth-link-wrapper-inline">
          <a href="/forgot" className="ft-auth-link">
            Forgot your password?
          </a>
        </div>
      </form>

      {/* Sign Up Link */}
      <div className="ft-auth-footer-inline">
        <p className="ft-auth-footer-text">
          Don&apos;t have an account?{" "}
          <a href="/sign-up" className="ft-auth-footer-link">
            Sign up for free
          </a>
        </p>
      </div>
    </>
  );
}
