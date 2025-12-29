/**──────────────────────────────────────────────────────────────────────┐
│  🔐 OUTLOOK OAUTH - Callback Endpoint                                  │
│  /src/app/api/auth/outlook/callback/route.ts                          │
│                                                                        │
│  Receives auth code from Microsoft, exchanges for tokens              │
│  Stores encrypted tokens in Convex, triggers initial sync             │
└────────────────────────────────────────────────────────────────────────┘ */

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { fetchMutation, fetchQuery, fetchAction } from 'convex/nextjs';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * GET /api/auth/outlook/callback?code=xxx&state=xxx
 *
 * Microsoft redirects here after user authorizes app
 *
 * Flow:
 * 1. Extract authorization code from query params
 * 2. Exchange code for access token + refresh token
 * 3. Store tokens in Convex (encrypted)
 * 4. Trigger initial email sync
 * 5. Redirect back to email console
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateParam = searchParams.get('state') || '';

  // Decode state parameter (contains userId + returnUrl)
  let userId: Id<'admin_users'>;
  let returnUrl = '/productivity/email';

  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    userId = decoded.userId as Id<'admin_users'>;
    returnUrl = decoded.returnUrl || returnUrl;
  } catch (e) {
    console.error('Failed to decode state parameter:', e);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/productivity/email?outlook_error=invalid_state`
    );
  }

  // Handle OAuth error
  if (error) {
    console.error('Outlook OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?outlook_error=${error}`
    );
  }

  // Validate authorization code
  if (!code) {
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/outlook/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'Microsoft OAuth not configured' },
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: [
            'https://graph.microsoft.com/Mail.Read',
            'https://graph.microsoft.com/Mail.ReadWrite',
            'https://graph.microsoft.com/User.Read',
            'offline_access',
          ].join(' '),
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiration timestamp
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // Store tokens in Convex (will be encrypted by mutation)
    await fetchMutation(api.productivity.email.outlook.storeOutlookTokens, {
      userId, // Pass userId from state parameter
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope: tokens.scope,
    });

    // Trigger initial email sync (background job)
    await fetchMutation(api.productivity.email.outlook.triggerOutlookSync, {
      userId, // Pass userId to sync function
    });

    // Create webhook subscription for real-time notifications
    // This happens in the background - don't block redirect on it
    try {
      const account = await fetchQuery(api.productivity.email.webhooks.getEmailAccountByUser, {
        userId,
      });

      if (account) {
        // Fire and forget - webhook creation is async and can fail gracefully
        fetchAction(api.productivity.email.webhooks.createOutlookWebhookSubscription, {
          accountId: account._id,
          userId,
        }).catch((err) => {
          console.error('Failed to create webhook subscription:', err);
          // Don't throw - user can still use polling fallback
        });
      }
    } catch (webhookError) {
      console.error('Error setting up webhook:', webhookError);
      // Continue anyway - polling will still work
    }

    // Redirect back to email console with success indicator
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?outlook_connected=true`
    );
  } catch (error) {
    console.error('Outlook OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}${returnUrl}?outlook_error=token_exchange_failed`
    );
  }
}
