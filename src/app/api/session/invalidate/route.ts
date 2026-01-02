/**──────────────────────────────────────────────────────────────────────┐
│  🧹 SESSION INVALIDATION - Self-Healing Endpoint                     │
│  /src/app/api/session/invalidate/route.ts                            │
│                                                                       │
│  Clears stale session cookies and redirects to sign-in.              │
│  Used for automatic recovery when user record no longer exists       │
│  (e.g., after DB nuke, data reset, or schema migration).             │
│                                                                       │
│  The frontend calls this when it detects "User not found" errors.    │
│  This ensures users never get stuck in an error loop.                │
└────────────────────────────────────────────────────────────────────────┘ */

import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/fuse/hydration/session/cookie';

/**
 * GET /api/session/invalidate
 *
 * Self-healing endpoint that:
 * 1. Clears the FUSE session cookie
 * 2. Redirects to sign-in page with a clean slate
 *
 * This prevents users from getting stuck in an error loop when their
 * session references a user that no longer exists in the database.
 */
export async function GET(request: NextRequest) {
  console.log('🧹 Session Invalidation: Clearing stale session cookie');

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('session', 'expired');

  const response = NextResponse.redirect(signInUrl, 303);

  // Clear the FUSE session cookie
  clearSessionCookie(response);

  // Also clear any Clerk-related cookies to ensure clean slate
  // Note: Clerk manages its own cookies, but we can hint to clear them
  response.cookies.set('__clerk_db_jwt', '', {
    path: '/',
    expires: new Date(0),
  });
  response.cookies.set('__session', '', {
    path: '/',
    expires: new Date(0),
  });

  console.log('🧹 Session Invalidation: Redirecting to sign-in');
  return response;
}
