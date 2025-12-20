/**──────────────────────────────────────────────────────────────────────┐
│  🔒 SERVER-SIDE EMAIL MANAGEMENT                                       │
│  /api/user/email/make-primary                                          │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 9                                        │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use userId (sovereign _id)                  │
│  - SID-12.1: Clerk API uses session.clerkId (permitted)                │
│                                                                        │
│  ADMIRAL SUPPORT:                                                      │
│  - Accepts optional targetClerkId to edit other users                  │
│  - Requires Admiral rank when changing another user's primary email    │
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

    // Determine which user to operate on
    let targetUserClerkId = session.clerkId; // Default to session user

    // If targeting another user, verify Admiral permissions
    if (targetClerkId && targetClerkId !== session.clerkId) {
      console.log('[API MAKE PRIMARY] Admiral operation detected - targetClerkId:', targetClerkId);

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
        console.log('[API MAKE PRIMARY] Permission denied - user rank:', requestingUser.rank);
        return NextResponse.json(
          { error: "Permission denied - Admiral rank required to edit other users" },
          { status: 403 }
        );
      }

      console.log('[API MAKE PRIMARY] Admiral permission verified');
      targetUserClerkId = targetClerkId;
    }

    if (!emailAddressId || typeof emailAddressId !== 'string') {
      return NextResponse.json(
        { error: "Invalid email address ID" },
        { status: 400 }
      );
    }

    console.log('[API MAKE PRIMARY] Changing primary email for user:', targetUserClerkId);
    console.log('[API MAKE PRIMARY] New primary email ID:', emailAddressId);

    // 🛡️ SID-12.1: Clerk API uses clerkId (permitted for Clerk operations)
    const client = await clerkClient();
    const updatedUser = await client.users.updateUser(targetUserClerkId, {
      primaryEmailAddressID: emailAddressId
    });

    console.log('[API MAKE PRIMARY] Primary email updated successfully');
    console.log('[API MAKE PRIMARY] New primary:', updatedUser.primaryEmailAddress?.emailAddress);

    // Return the updated email addresses
    const primaryEmail = updatedUser.primaryEmailAddress?.emailAddress;
    const secondaryEmail = updatedUser.emailAddresses.find(
      e => e.id !== updatedUser.primaryEmailAddressId
    )?.emailAddress || null;

    return NextResponse.json({
      success: true,
      primaryEmail,
      secondaryEmail,
      message: "Primary email updated successfully"
    });

  } catch (error) {
    console.error('[API MAKE PRIMARY] Error:', error);

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
      { error: "Failed to update primary email" },
      { status: 500 }
    );
  }
}
