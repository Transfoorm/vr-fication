// 🛡️ S.I.D. COMPLIANT SESSION API
// FUSE 6.0 + Sovereign Identity Doctrine
//
// This route now delegates to the Identity Handoff Ceremony
// which is the ONE place where Clerk identity enters the system.
//
// REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/fuse/hydration/session/cookie';
import { performIdentityHandoff } from '@/app/(auth)/actions/identity-handoff';

// GET /api/session — Clerk redirects here after sign-in
// Now delegates to the Identity Handoff Ceremony (SID-1.5)
export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('🛡️ SID: Session route invoked — delegating to Identity Handoff Ceremony');

  try {
    // ═══════════════════════════════════════════════════════════════
    // 🛡️ IDENTITY HANDOFF CEREMONY
    //
    // This is now THE ONLY path to session creation.
    // The ceremony ensures:
    // - SID-1.1: Identity originates from Convex, not auth()
    // - SID-1.5: Handoff occurs exactly once
    // - SID-1.6: No session without valid Convex _id
    // - SID-1.7: FUSE is source of truth after handoff
    // ═══════════════════════════════════════════════════════════════
    const result = await performIdentityHandoff();

    if (!result.success) {
      console.error('🛡️ SID: Identity Handoff FAILED:', result.error);
      const signInUrl = new URL('/sign-in', request.url);
      signInUrl.searchParams.set('error', 'session_failed');
      return NextResponse.redirect(signInUrl);
    }

    // Session was minted with sovereign identity — redirect to app
    console.log(`✅ SID Session: ${Date.now() - startTime}ms (sovereign identity established)`);
    console.log(`   Sovereign _id: ${result.userId}`);

    return NextResponse.redirect(new URL('/', request.url), 303);

  } catch (error) {
    console.error('🛡️ SID: Session route CATASTROPHIC FAILURE:', error);
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('error', 'session_failed');
    return NextResponse.redirect(signInUrl);
  }
}

// POST /api/session — Manual session creation via Identity Handoff
export async function POST(request: Request) {
  console.log('🛡️ SID: Session POST — delegating to Identity Handoff Ceremony');

  try {
    const result = await performIdentityHandoff();

    if (!result.success) {
      console.error('🛡️ SID: POST Identity Handoff FAILED:', result.error);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('✅ SID Session POST: Sovereign identity established');
    return NextResponse.redirect(new URL('/', request.url), 303);

  } catch (error) {
    console.error('🛡️ SID: Session POST FAILED:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/session — Clear FUSE cookie (sovereign session destruction)
export async function DELETE() {
  console.log('🛡️ SID: Session DELETE — clearing sovereign cookie');
  const res = new NextResponse(null, { status: 204 });
  clearSessionCookie(res);
  return res;
}

// ═══════════════════════════════════════════════════════════════════════
// 🛡️ S.I.D. PHASE 0 COMPLETE
//
// This route now enforces:
// - SID-1.1: Identity does NOT originate from auth() here
// - SID-1.5: Identity Handoff Ceremony is the ONLY path
// - SID-1.6: No session without valid Convex _id
// - SID-1.7: FUSE cookie is sovereign after handoff
//
// The poisoned flow (auth() → clerkId → Convex lookup → empty _id) is ELIMINATED.
// The sovereign flow (Identity Handoff → ensureUser → guaranteed _id) is ESTABLISHED.
//
// REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
// ═══════════════════════════════════════════════════════════════════════
