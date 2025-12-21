/**──────────────────────────────────────────────────────────────────────┐
│  🔐 OUTLOOK OAUTH - Authorization Endpoint                             │
│  /src/app/api/auth/outlook/authorize/route.ts                         │
│                                                                        │
│  Microsoft Graph OAuth 2.0 flow                                       │
│  Scopes: Mail.Read, Mail.ReadWrite, offline_access                    │
└────────────────────────────────────────────────────────────────────────┘ */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/outlook/authorize
 *
 * Redirects user to Microsoft OAuth consent screen
 *
 * Flow:
 * 1. User clicks "Connect Outlook" button
 * 2. This endpoint redirects to Microsoft login
 * 3. User authorizes app
 * 4. Microsoft redirects to /api/auth/outlook/callback
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get('returnUrl') || '/productivity/email';

  // Microsoft OAuth configuration
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`;
  const scope = [
    'https://graph.microsoft.com/Mail.Read',
    'https://graph.microsoft.com/Mail.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'offline_access', // Required for refresh tokens
  ].join(' ');

  if (!clientId) {
    return NextResponse.json(
      { error: 'Microsoft OAuth not configured' },
      { status: 500 }
    );
  }

  // Build Microsoft authorization URL
  const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_mode', 'query');
  authUrl.searchParams.set('state', returnUrl); // Pass return URL via state

  // Redirect to Microsoft login
  return NextResponse.redirect(authUrl.toString());
}
