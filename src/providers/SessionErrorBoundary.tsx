/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ SESSION ERROR BOUNDARY - Self-Healing User Recovery              │
│  /src/providers/SessionErrorBoundary.tsx                              │
│                                                                       │
│  Catches "User not found" errors from Convex queries and             │
│  automatically invalidates the stale session, redirecting            │
│  the user to sign-in with a clean slate.                             │
│                                                                       │
│  This prevents users from getting stuck in error loops after:        │
│  - Database nukes/resets                                             │
│  - Schema migrations                                                 │
│  - User record deletions                                             │
│                                                                       │
│  Principle: Frontend must never brick itself because backend         │
│  state disappeared. Session invalidation is self-healing.            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isInvalidating: boolean;
}

/**
 * Patterns that indicate a stale session (user record no longer exists)
 */
const STALE_SESSION_PATTERNS = [
  'User not found',
  'user not found',
  'USER NOT FOUND',
  'No user found',
  'Invalid user',
  'User does not exist',
];

/**
 * Check if an error indicates a stale session
 */
function isStaleSessionError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message;
  return STALE_SESSION_PATTERNS.some((pattern) => message.includes(pattern));
}

export class SessionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isInvalidating: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a stale session error
    if (isStaleSessionError(error)) {
      return { hasError: true };
    }
    // Re-throw non-session errors to be handled by other boundaries
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (isStaleSessionError(error)) {
      console.error('🛡️ SessionErrorBoundary: Stale session detected');
      console.error('   Error:', error.message);
      console.error('   Component Stack:', errorInfo.componentStack);

      // Trigger session invalidation
      this.invalidateSession();
    }
  }

  invalidateSession = () => {
    if (this.state.isInvalidating) return;

    this.setState({ isInvalidating: true });
    console.log('🧹 SessionErrorBoundary: Redirecting to session invalidation...');

    // Use window.location for a full page navigation to clear all state
    window.location.href = '/api/session/invalidate';
  };

  render() {
    if (this.state.hasError) {
      // Return null while redirecting - the redirect happens immediately in componentDidCatch
      // We can't use VRs here because they may not be loaded yet
      return null;
    }

    return this.props.children;
  }
}
