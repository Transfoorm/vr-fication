/**──────────────────────────────────────────────────────────────────────┐
│  🔒 SERVER-SIDE PASSWORD MANAGEMENT                                    │
│  /api/user/password/change                                             │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 9                                        │
│  - SID-9.1: Identity from readSessionCookie(), NOT auth()              │
│  - SID-5.3: Convex queries use userId (sovereign _id)                  │
│  - SID-12.1: Clerk API uses session.clerkId (permitted)                │
│                                                                        │
│  ADMIRAL SUPPORT:                                                      │
│  - Accepts optional targetClerkId to edit other users                  │
│  - Requires Admiral rank when changing another user's password         │
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

    // Get data from request body
    const { newPassword, targetClerkId } = await req.json();

    // Determine which user to operate on
    let targetUserClerkId = session.clerkId; // Default to session user

    // If targeting another user, verify Admiral permissions
    if (targetClerkId && targetClerkId !== session.clerkId) {
      console.log('[API PASSWORD CHANGE] Admiral operation detected - targetClerkId:', targetClerkId);

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
        console.log('[API PASSWORD CHANGE] Permission denied - user rank:', requestingUser.rank);
        return NextResponse.json(
          { error: "Permission denied - Admiral rank required to edit other users" },
          { status: 403 }
        );
      }

      console.log('[API PASSWORD CHANGE] Admiral permission verified');
      targetUserClerkId = targetClerkId;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    // Validate new password requirements (same as signup)
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must include at least 1 uppercase letter" },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must include at least 1 number" },
        { status: 400 }
      );
    }

    if (!/[^a-zA-Z0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must include at least 1 symbol" },
        { status: 400 }
      );
    }

    console.log('[API PASSWORD CHANGE] Changing password for user:', targetUserClerkId);

    // 🛡️ SID-12.1: Clerk API uses clerkId (permitted for Clerk operations)
    const client = await clerkClient();

    await client.users.updateUser(targetUserClerkId, {
      password: newPassword,
    });

    console.log('[API PASSWORD CHANGE] Password updated successfully');

    return NextResponse.json({
      success: true,
      message: "Password updated successfully"
    });

  } catch (error) {
    console.error('[API PASSWORD CHANGE] Error:', error);

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
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}
