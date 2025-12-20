/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.0 - ADMIRAL DELETE MUTATION                         │
│  /convex/vanish/deleteAnyUser.ts                                          │
│                                                                           │
│  Admiral-initiated tenant-scale user deletion.                            │
│  Allows Admiral rank admin_users to delete any user account.                    │
│                                                                           │
│  ⚠️ QUARANTINED FROM SID: VANISH requires ClerkID for cross-system       │
│  deletion integrity. Clerk account must be deleted alongside Convex.      │
│                                                                           │
│  RANK REQUIREMENTS:                                                       │
│  - Only Admiral rank can execute                                          │
│  - Used from rank-gated "Users" admin page                                │
│  - Complete audit trail (who deleted whom)                                │
│                                                                           │
│  SAFETY:                                                                  │
│  - Admiral rank verification                                              │
│  - Cannot delete other Admirals (prevent lockout)                         │
│  - Idempotent (safe to retry)                                             │
│  - Required reason for compliance                                         │
│                                                                           │
│  USAGE:                                                                   │
│  const result = await deleteAnyUser({                                     │
│    targetClerkId: "user_123...",                                          │
│    reason: "Account violation"                                            │
│  });                                                                      │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { executeUserDeletionCascade } from "./cascade";
import { getUserIdFromClerkId } from "@/convex/identity/registry";

/**
 * DELETE ANY USER (ADMIRAL ONLY)
 *
 * Tenant-scale user deletion for Admiral rank.
 * Used from admin interface to manage user accounts.
 *
 * AUTHORIZATION: Admiral rank required
 * AUDIT: Complete trail of who deleted whom and why
 *
 * ⚠️ QUARANTINED FROM SID: Uses ClerkID for target identification
 * because VANISH destroys identity across both Clerk AND Convex systems.
 *
 * @param targetClerkId - Clerk ID of user to delete
 * @param reason - Required reason for deletion (compliance)
 * @returns Cascade execution result
 *
 * @throws Error if caller is not Admiral rank
 * @throws Error if target is Admiral (prevent lockout)
 * @throws Error if target user not found
 *
 * PROCESS:
 * 1. Authenticate caller (ctx.auth)
 * 2. Verify Admiral rank
 * 3. Find target user by clerkId
 * 4. Verify target is not Admiral (safety)
 * 5. Execute cascade deletion
 * 6. Return audit trail
 */
export const deleteAnyUser = mutation({
  args: {
    /** Clerk ID of user to delete */
    targetClerkId: v.string(),

    /** Required reason for deletion (audit/compliance) */
    reason: v.string(),

    /** Optional: New owner ID for reassign strategies */
    reassignToUserId: v.optional(v.id("admin_users")),
  },

  handler: async (ctx, args) => {
    // ═══════════════════════════════════════════════════════════════
    // 1. AUTHENTICATE CALLER
    // ═══════════════════════════════════════════════════════════════

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[VANISH] Unauthenticated: Must be logged in as Admiral");
    }

    const callerClerkId = identity.subject;

    // ═══════════════════════════════════════════════════════════════
    // 2. VERIFY ADMIRAL RANK
    // 🛡️ S.I.D. Phase 14: Use identity registry for Clerk→Convex lookup
    // ═══════════════════════════════════════════════════════════════

    const callerUserId = await getUserIdFromClerkId(ctx.db, callerClerkId);
    if (!callerUserId) {
      throw new Error(
        `[VANISH] Caller not found in registry: No mapping for ${callerClerkId}`
      );
    }

    const caller = await ctx.db.get(callerUserId);
    if (!caller) {
      throw new Error(
        `[VANISH] Caller not found: No Convex user record for ${callerUserId}`
      );
    }

    if (caller.rank !== "admiral") {
      throw new Error(
        `[VANISH] Unauthorized: Only Admiral rank can delete admin_users (current rank: ${caller.rank || 'none'})`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. FIND TARGET USER BY CLERKID
    // 🛡️ S.I.D. Phase 14: Use identity registry for Clerk→Convex lookup
    // ⚠️ QUARANTINED: VANISH requires ClerkID for cross-system deletion
    // ═══════════════════════════════════════════════════════════════

    const targetUserId = await getUserIdFromClerkId(ctx.db, args.targetClerkId);
    if (!targetUserId) {
      throw new Error(
        `[VANISH] Target not found in registry: No mapping for clerkId ${args.targetClerkId}`
      );
    }

    const targetUser = await ctx.db.get(targetUserId);
    if (!targetUser) {
      throw new Error(
        `[VANISH] Target not found: No user with clerkId ${args.targetClerkId}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. PREVENT ADMIRAL DELETION (SAFETY)
    // ═══════════════════════════════════════════════════════════════

    if (targetUser.rank === "admiral") {
      throw new Error(
        `[VANISH] Safety block: Cannot delete Admiral admin_users (prevents tenant lockout). ` +
        `Target: ${targetUser.email}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. VERIFY REQUIRED REASON
    // ═══════════════════════════════════════════════════════════════

    if (!args.reason || args.reason.trim().length === 0) {
      throw new Error(
        "[VANISH] Invalid reason: Must provide reason for admin deletion"
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. EXECUTE CASCADE DELETION
    // ═══════════════════════════════════════════════════════════════

    console.log(`[VANISH] 🗑️  Admin delete initiated by ${caller.email} (Admiral)`);
    console.log(`[VANISH]    Target: ${targetUser.email} (${args.targetClerkId})`);
    console.log(`[VANISH]    Reason: ${args.reason}`);

    const result = await executeUserDeletionCascade(
      ctx.db,
      ctx.storage,
      targetUser._id,
      caller._id, // SOVEREIGN: deletedBy = Admiral's Convex _id
      {
        newOwnerId: args.reassignToUserId,
        deleteStorageFiles: true,
        skipClerkDeletion: false,
        reason: args.reason, // Store deletion reason in audit log
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // 7. RETURN AUDIT TRAIL
    // ═══════════════════════════════════════════════════════════════

    if (result.success) {
      console.log(`[VANISH] ✅ Admin delete completed`);
      console.log(`[VANISH]    Admiral: ${caller.email}`);
      console.log(`[VANISH]    Target: ${targetUser.email}`);
      console.log(`[VANISH]    Tables: ${result.tablesProcessed.join(', ')}`);
      console.log(`[VANISH]    Records deleted: ${result.recordsDeleted}`);
      console.log(`[VANISH]    Records anonymized: ${result.recordsAnonymized}`);
      console.log(`[VANISH]    Files deleted: ${result.filesDeleted.length}`);
      console.log(`[VANISH]    Duration: ${result.duration}ms`);
    } else {
      console.error(`[VANISH] ❌ Admin delete failed: ${result.errorMessage}`);
    }

    return {
      success: result.success,
      message: result.success
        ? `User ${targetUser.email} deleted successfully by Admiral ${caller.email}`
        : `Deletion failed: ${result.errorMessage}`,
      details: {
        adminEmail: caller.email,
        targetEmail: targetUser.email,
        reason: args.reason,
        tablesProcessed: result.tablesProcessed,
        recordsDeleted: result.recordsDeleted,
        recordsAnonymized: result.recordsAnonymized,
        filesDeleted: result.filesDeleted.length,
        duration: result.duration,
      },
    };
  },
});
