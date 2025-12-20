/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.1 - ADMIRAL DELETE ACTION (with Clerk deletion)     │
│  /convex/vanish/deleteAnyUserAction.ts                                    │
│                                                                           │
│  Action wrapper for complete user deletion including Clerk accounts.      │
│  Actions can make HTTP requests (mutations cannot).                       │
│                                                                           │
│  ARCHITECTURE:                                                            │
│  - Actions can call mutations AND make HTTP requests                      │
│  - Mutations can only modify database (no HTTP)                           │
│  - This action orchestrates both operations                               │
│                                                                           │
│  PROCESS:                                                                 │
│  1. Call mutation to delete from Convex (database + audit log)            │
│  2. Call Clerk API to delete authentication account                       │
│  3. Update audit log with Clerk deletion status                           │
│                                                                           │
│  VANISH PROTOCOL 2.1:                                                     │
│  - Complete database cascade ✓                                            │
│  - Complete Clerk deletion ✓ (NOW WORKING)                                │
│  - Complete audit trail ✓                                                 │
└───────────────────────────────────────────────────────────────────────────┘ */

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { api, internal } from "@/convex/_generated/api";

/**
 * DELETE ANY USER - ACTION (with Clerk deletion)
 *
 * Complete user deletion including Clerk authentication account.
 * This action orchestrates both database and Clerk deletions.
 *
 * @param targetClerkId - Clerk ID of user to delete
 * @param reason - Required reason for deletion (compliance)
 * @returns Complete deletion result with Clerk status
 */
type DeleteActionResult = {
  success: boolean;
  message: string;
  convexResult?: {
    success: boolean;
    message: string;
    details: {
      adminEmail: string;
      targetEmail: string;
      reason: string;
      tablesProcessed: string[];
      recordsDeleted: number;
      recordsAnonymized: number;
      filesDeleted: number;
      duration: number;
    };
  };
  clerkDeleted: boolean;
  clerkError?: string;
};

export const deleteAnyUserWithClerk = action({
  args: {
    targetClerkId: v.string(),
    reason: v.string(),
    reassignToUserId: v.optional(v.id("admin_users")),
  },

  handler: async (ctx, args): Promise<DeleteActionResult> => {
    console.log(`[VANISH ACTION] 🔥 Starting complete user deletion (Convex + Clerk)`);
    console.log(`[VANISH ACTION]    Target Clerk ID: ${args.targetClerkId}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Delete from Convex database (mutation)
    // ═══════════════════════════════════════════════════════════════

    let convexResult;
    try {
      console.log(`[VANISH ACTION] Step 1: Deleting from Convex database...`);

      convexResult = await ctx.runMutation(api.vanish.deleteAnyUser.deleteAnyUser, {
        targetClerkId: args.targetClerkId,
        reason: args.reason,
        reassignToUserId: args.reassignToUserId,
      });

      if (!convexResult.success) {
        return {
          success: false,
          message: `Convex deletion failed: ${convexResult.message}`,
          clerkDeleted: false,
        };
      }

      console.log(`[VANISH ACTION] ✅ Step 1 complete: Convex database cleaned`);
    } catch (error) {
      console.error(`[VANISH ACTION] ❌ Convex deletion failed:`, error);
      return {
        success: false,
        message: `Convex deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        clerkDeleted: false,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete from Clerk (Direct SDK call)
    // ═══════════════════════════════════════════════════════════════

    let clerkDeleted = false;
    let clerkError: string | undefined;

    try {
      console.log(`[VANISH ACTION] Step 2: Deleting from Clerk...`);
      console.log(`[VANISH ACTION]    Target Clerk ID: ${args.targetClerkId}`);

      // Use Clerk SDK directly with secret key
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (!clerkSecretKey) {
        throw new Error('CLERK_SECRET_KEY not found in environment');
      }

      const response = await fetch(`https://api.clerk.com/v1/users/${args.targetClerkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`[VANISH ACTION] ✅ Step 2 complete: Clerk account deleted`);
        clerkDeleted = true;
      } else if (response.status === 404) {
        // Already deleted
        console.log(`[VANISH ACTION] ✅ Step 2 complete: Clerk account already deleted (404)`);
        clerkDeleted = true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        clerkError = errorData.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[VANISH ACTION] ⚠️  Step 2 failed: ${clerkError}`);
      }
    } catch (error) {
      console.error(`[VANISH ACTION] ❌ Clerk deletion error:`, error);
      clerkError = error instanceof Error ? error.message : 'Unknown error';
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Update audit log with Clerk deletion status
    // ═══════════════════════════════════════════════════════════════

    try {
      console.log(`[VANISH ACTION] Step 3: Updating audit log with Clerk status...`);

      await ctx.runMutation(api.vanish.updateClerkDeletionStatus.updateClerkDeletionStatus, {
        targetClerkId: args.targetClerkId,
        clerkDeleted,
        clerkError,
      });

      console.log(`[VANISH ACTION] ✅ Step 3 complete: Audit log updated`);
    } catch (error) {
      console.error(`[VANISH ACTION] ⚠️  Failed to update audit log:`, error);
      // Non-fatal - continue
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL RESULT
    // ═══════════════════════════════════════════════════════════════

    console.log(`[VANISH ACTION] 🎉 Complete deletion finished`);
    console.log(`[VANISH ACTION]    Convex: ✓ Deleted`);
    console.log(`[VANISH ACTION]    Clerk: ${clerkDeleted ? '✓ Deleted' : '✗ Failed'}`);

    return {
      success: true,
      message: clerkDeleted
        ? `User completely deleted (Convex + Clerk)`
        : `User deleted from Convex, but Clerk deletion failed: ${clerkError}`,
      convexResult,
      clerkDeleted,
      clerkError,
    };
  },
});

/**
 * 🛡️ S.I.D. Phase 15: DELETE ANY USER V2 - Accepts sovereign userId
 *
 * Same as deleteAnyUserWithClerk but accepts Convex userId instead of clerkId.
 * Looks up clerkId from admin_users_ClerkRegistry internally.
 *
 * @param targetUserId - Convex _id of user to delete (sovereign)
 * @param reason - Required reason for deletion (compliance)
 * @returns Complete deletion result with Clerk status
 */
export const deleteAnyUserWithClerkV2 = action({
  args: {
    targetUserId: v.id("admin_users"),
    reason: v.string(),
    reassignToUserId: v.optional(v.id("admin_users")),
  },

  handler: async (ctx, args): Promise<DeleteActionResult> => {
    console.log(`[VANISH ACTION V2] 🔥 Starting complete user deletion (Convex + Clerk)`);
    console.log(`[VANISH ACTION V2]    Target User ID: ${args.targetUserId}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 0: Look up clerkId from identity registry
    // 🛡️ S.I.D. Phase 15: Registry lookup happens inside VANISH quarantine
    // ═══════════════════════════════════════════════════════════════

    // Use internal query to get clerkId from registry
    const clerkId = await ctx.runQuery(internal.vanish.getClerkIdForDeletion.getClerkIdForDeletion, {
      userId: args.targetUserId,
    });

    if (!clerkId) {
      return {
        success: false,
        message: `User not found in identity registry: ${args.targetUserId}`,
        clerkDeleted: false,
      };
    }

    console.log(`[VANISH ACTION V2]    Resolved Clerk ID: ${clerkId}`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Delete from Convex database (mutation)
    // ═══════════════════════════════════════════════════════════════

    let convexResult;
    try {
      console.log(`[VANISH ACTION V2] Step 1: Deleting from Convex database...`);

      convexResult = await ctx.runMutation(api.vanish.deleteAnyUser.deleteAnyUser, {
        targetClerkId: clerkId,
        reason: args.reason,
        reassignToUserId: args.reassignToUserId,
      });

      if (!convexResult.success) {
        return {
          success: false,
          message: `Convex deletion failed: ${convexResult.message}`,
          clerkDeleted: false,
        };
      }

      console.log(`[VANISH ACTION V2] ✅ Step 1 complete: Convex database cleaned`);
    } catch (error) {
      console.error(`[VANISH ACTION V2] ❌ Convex deletion failed:`, error);
      return {
        success: false,
        message: `Convex deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        clerkDeleted: false,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete from Clerk (Direct SDK call)
    // ═══════════════════════════════════════════════════════════════

    let clerkDeleted = false;
    let clerkError: string | undefined;

    try {
      console.log(`[VANISH ACTION V2] Step 2: Deleting from Clerk...`);
      console.log(`[VANISH ACTION V2]    Target Clerk ID: ${clerkId}`);

      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (!clerkSecretKey) {
        throw new Error('CLERK_SECRET_KEY not found in environment');
      }

      const response = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`[VANISH ACTION V2] ✅ Step 2 complete: Clerk account deleted`);
        clerkDeleted = true;
      } else if (response.status === 404) {
        console.log(`[VANISH ACTION V2] ✅ Step 2 complete: Clerk account already deleted (404)`);
        clerkDeleted = true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        clerkError = errorData.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[VANISH ACTION V2] ⚠️  Step 2 failed: ${clerkError}`);
      }
    } catch (error) {
      console.error(`[VANISH ACTION V2] ❌ Clerk deletion error:`, error);
      clerkError = error instanceof Error ? error.message : 'Unknown error';
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Update audit log with Clerk deletion status
    // ═══════════════════════════════════════════════════════════════

    try {
      console.log(`[VANISH ACTION V2] Step 3: Updating audit log with Clerk status...`);

      await ctx.runMutation(api.vanish.updateClerkDeletionStatus.updateClerkDeletionStatus, {
        targetClerkId: clerkId,
        clerkDeleted,
        clerkError,
      });

      console.log(`[VANISH ACTION V2] ✅ Step 3 complete: Audit log updated`);
    } catch (error) {
      console.error(`[VANISH ACTION V2] ⚠️  Failed to update audit log:`, error);
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL RESULT
    // ═══════════════════════════════════════════════════════════════

    console.log(`[VANISH ACTION V2] 🎉 Complete deletion finished`);
    console.log(`[VANISH ACTION V2]    Convex: ✓ Deleted`);
    console.log(`[VANISH ACTION V2]    Clerk: ${clerkDeleted ? '✓ Deleted' : '✗ Failed'}`);

    return {
      success: true,
      message: clerkDeleted
        ? `User completely deleted (Convex + Clerk)`
        : `User deleted from Convex, but Clerk deletion failed: ${clerkError}`,
      convexResult,
      clerkDeleted,
      clerkError,
    };
  },
});
