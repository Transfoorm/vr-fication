/**──────────────────────────────────────────────────────────────────────┐
│  🔥 CLERK USER DELETION API                                            │
│  /api/clerk/delete-user                                                │
│                                                                        │
│  Server-side API route that calls Clerk's deleteUser() API             │
│  Part of VANISH Protocol 2.1 - Complete account deletion               │
│                                                                        │
│  AUTHORIZATION:                                                        │
│  - Caller must be authenticated                                        │
│  - Caller must have Admiral rank in Convex                             │
│  - Cannot be called from client-side code                              │
│                                                                        │
│  VANISH INTEGRATION:                                                   │
│  - Called by Convex cascade after database cleanup                     │
│  - Deletes Clerk authentication account                                │
│  - Prevents orphaned Clerk accounts                                    │
│                                                                        │
│  SAFETY:                                                               │
│  - Admiral rank verification required                                  │
│  - Complete audit trail                                                │
│  - Graceful error handling                                             │
└────────────────────────────────────────────────────────────────────────┘ */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * DELETE USER FROM CLERK
 *
 * Deletes a user's Clerk authentication account.
 * Admiral-only operation for VANISH Protocol.
 *
 * @param targetClerkId - Clerk ID of user to delete
 * @returns Success status and any error messages
 */
export async function POST(req: Request) {
  try {
    // ═══════════════════════════════════════════════════════════════
    // 1. AUTHENTICATE CALLER
    // ═══════════════════════════════════════════════════════════════

    const { userId } = await auth();

    if (!userId) {
      console.error('[CLERK DELETE] Unauthorized: No authenticated user');
      return NextResponse.json(
        { success: false, error: "Unauthorized: Authentication required" },
        { status: 401 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. VERIFY ADMIRAL RANK
    // ═══════════════════════════════════════════════════════════════

    const callingUser = await convex.query(api.domains.admin.users.api.getUserByClerkId, {
      clerkId: userId,
    });

    if (!callingUser) {
      console.error('[CLERK DELETE] Caller not found in Convex:', userId);
      return NextResponse.json(
        { success: false, error: "User not found in database" },
        { status: 404 }
      );
    }

    if (callingUser.rank !== 'admiral') {
      console.error('[CLERK DELETE] Unauthorized: Not Admiral rank:', callingUser.rank);
      return NextResponse.json(
        { success: false, error: "Unauthorized: Admiral rank required" },
        { status: 403 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. GET TARGET CLERK ID FROM REQUEST
    // ═══════════════════════════════════════════════════════════════

    const { targetClerkId } = await req.json();

    if (!targetClerkId) {
      console.error('[CLERK DELETE] Missing targetClerkId parameter');
      return NextResponse.json(
        { success: false, error: "Missing targetClerkId parameter" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. DELETE USER FROM CLERK
    // ═══════════════════════════════════════════════════════════════

    console.log(`[CLERK DELETE] 🗑️  Deleting Clerk account: ${targetClerkId}`);
    console.log(`[CLERK DELETE]    Requested by Admiral: ${callingUser.email}`);

    const client = await clerkClient();
    await client.users.deleteUser(targetClerkId);

    console.log(`[CLERK DELETE] ✅ Successfully deleted Clerk account: ${targetClerkId}`);

    return NextResponse.json({
      success: true,
      message: `Clerk account ${targetClerkId} deleted successfully`,
    });

  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // ERROR HANDLING
    // ═══════════════════════════════════════════════════════════════

    console.error('[CLERK DELETE] ❌ Error deleting Clerk user:', error);

    // Type guard for error object
    const clerkError = error as { status?: number; errors?: Array<{ code?: string }>; message?: string; toString?: () => string };

    // Check if user doesn't exist in Clerk (already deleted)
    if (clerkError?.status === 404 || clerkError?.errors?.[0]?.code === 'resource_not_found') {
      console.log('[CLERK DELETE] User already deleted from Clerk (404) - treating as success');
      return NextResponse.json({
        success: true,
        message: 'User already deleted from Clerk',
        wasAlreadyDeleted: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: clerkError.message || 'Failed to delete Clerk user',
        details: clerkError.errors || clerkError.toString?.() || String(error),
      },
      { status: 500 }
    );
  }
}
