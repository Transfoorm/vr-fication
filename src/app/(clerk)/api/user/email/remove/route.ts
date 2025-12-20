/**──────────────────────────────────────────────────────────────────────┐
│  🔒 SERVER-SIDE EMAIL MANAGEMENT                                       │
│  /api/user/email/remove                                                │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 9                                        │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use userId (sovereign _id)                  │
│  - SID-12.1: Clerk API uses session.clerkId (permitted)                │
│                                                                        │
│  ADMIRAL SUPPORT:                                                      │
│  - Accepts optional targetClerkId to verify permission                 │
│  - Requires Admiral rank when removing another user's email            │
└────────────────────────────────────────────────────────────────────────┘ */

import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { readSessionCookie } from '@/fuse/hydration/session/cookie';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: Request) {
  try {
    // 🛡️ SID-9.1: Identity from FUSE session cookie
    const session = await readSessionCookie();

    if (!session || !session._id || !session.clerkId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get email address ID and optional targetClerkId from request body
    const { emailAddressId, targetClerkId } = await req.json();

    // If targeting another user, verify Admiral permissions
    if (targetClerkId && targetClerkId !== session.clerkId) {
      console.log('[API EMAIL REMOVE] Admiral operation detected - targetClerkId:', targetClerkId);

      // 🛡️ SID-5.3: Query Convex using sovereign userId
      const requestingUser = await convex.query(api.domains.admin.users.api.getCurrentUser, {
        userId: session._id as Id<"admin_users">,
      });

      if (!requestingUser) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Check if user is Admiral
      if (requestingUser.rank !== 'admiral') {
        console.log('[API EMAIL REMOVE] Permission denied - user rank:', requestingUser.rank);
        return NextResponse.json(
          { error: "Permission denied - Admiral rank required to edit other users" },
          { status: 403 }
        );
      }

      console.log('[API EMAIL REMOVE] Admiral permission verified');
    }

    if (!emailAddressId || typeof emailAddressId !== 'string') {
      return NextResponse.json(
        { error: "Invalid email address ID" },
        { status: 400 }
      );
    }

    console.log('[API EMAIL REMOVE] Removing email for user:', session.clerkId);
    console.log('[API EMAIL REMOVE] Email ID:', emailAddressId);

    // 🛡️ SID-12.1: Clerk API (permitted for Clerk operations)
    const client = await clerkClient();
    await client.emailAddresses.deleteEmailAddress(emailAddressId);

    console.log('[API EMAIL REMOVE] Email removed successfully:', emailAddressId);

    return NextResponse.json({
      success: true,
      message: "Email address removed successfully"
    });

  } catch (error) {
    console.error('[API EMAIL REMOVE] Error:', error);

    // Type guard for Clerk errors
    const clerkError = error as { errors?: Array<{ message?: string; longMessage?: string }> };

    // Handle Clerk-specific errors
    if (clerkError.errors?.[0]) {
      const firstError = clerkError.errors[0];
      return NextResponse.json(
        { error: firstError.longMessage || firstError.message || 'Unknown error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to remove email address" },
      { status: 500 }
    );
  }
}
