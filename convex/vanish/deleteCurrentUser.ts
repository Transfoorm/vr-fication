/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.0 - SELF-DELETE MUTATION                            │
│  /convex/vanish/deleteCurrentUser.ts                                      │
│                                                                           │
│  User-initiated account deletion.                                         │
│  Allows authenticated admin_users to delete their own accounts.                 │
│                                                                           │
│  VANISH LAW COMPLIANCE:                                                   │
│  - No userId parameter accepted (derived from ctx.auth)                   │
│  - Two-step confirmation required (UI enforces "DELETE" typing)           │
│  - Complete cascade through all user-linked data                          │
│  - Immutable audit trail                                                  │
│                                                                           │
│  SAFETY:                                                                  │
│  - Only authenticated user can delete themselves                          │
│  - Idempotent (safe to retry)                                             │
│  - Optional reason capture for analytics                                  │
│                                                                           │
│  USAGE:                                                                   │
│  const result = await deleteCurrentUser({ reason: "No longer needed" });  │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { executeUserDeletionCascade } from "./cascade";
import { getUserIdFromClerkId } from "@/convex/identity/registry";

/**
 * DELETE CURRENT USER
 *
 * Self-deletion mutation for authenticated admin_users.
 * Cascades through all user-linked data according to DELETION_MANIFEST.
 *
 * VANISH LAW: "No mutation shall accept userId as param"
 * Identity is derived server-side from ctx.auth.getUserIdentity()
 *
 * @param reason - Optional reason for deletion (analytics/audit)
 * @returns Cascade execution result
 *
 * @throws Error if unauthenticated
 * @throws Error if user not found in Convex
 *
 * PROCESS:
 * 1. Authenticate user (ctx.auth)
 * 2. Find Convex user record by clerkId
 * 3. Execute cascade deletion
 * 4. Return audit trail
 *
 * NOTE: Clerk account deletion happens separately via webhook or external call
 */
export const deleteCurrentUser = mutation({
  args: {
    /** Optional reason for deletion (stored in audit log) */
    reason: v.optional(v.string()),

    /** Confirmation string (must be "DELETE" - enforced by UI) */
    confirmationString: v.string(),
  },

  handler: async (ctx, args) => {
    // ═══════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION CHECK
    // ═══════════════════════════════════════════════════════════════

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("[VANISH] Unauthenticated: Must be logged in to delete account");
    }

    const clerkId = identity.subject;

    // ═══════════════════════════════════════════════════════════════
    // 2. CONFIRMATION CHECK
    // ═══════════════════════════════════════════════════════════════

    if (args.confirmationString !== "DELETE") {
      throw new Error(
        "[VANISH] Invalid confirmation: Must type 'DELETE' to confirm account deletion"
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. FIND CONVEX USER RECORD
    // 🛡️ S.I.D. Phase 14: Use identity registry for Clerk→Convex lookup
    // ═══════════════════════════════════════════════════════════════

    const userId = await getUserIdFromClerkId(ctx.db, clerkId);
    if (!userId) {
      throw new Error(
        `[VANISH] User not found in registry: No mapping for clerkId ${clerkId}`
      );
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error(
        `[VANISH] User not found: No Convex user record for userId ${userId}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. EXECUTE CASCADE DELETION
    // ═══════════════════════════════════════════════════════════════

    console.log(`[VANISH] 🗑️  Self-delete initiated by ${user.email} (${clerkId})`);
    if (args.reason) {
      console.log(`[VANISH]    Reason: ${args.reason}`);
    }

    const result = await executeUserDeletionCascade(
      ctx.db,
      ctx.storage,
      user._id,
      user._id, // SOVEREIGN: deletedBy = self (user's own Convex _id)
      {
        deleteStorageFiles: true,
        skipClerkDeletion: false, // Clerk webhook will handle or manual cleanup
        reason: args.reason, // Store deletion reason in audit log
      }
    );

    // ═══════════════════════════════════════════════════════════════
    // 5. RETURN AUDIT TRAIL
    // ═══════════════════════════════════════════════════════════════

    if (result.success) {
      console.log(`[VANISH] ✅ Self-delete completed for ${user.email}`);
      console.log(`[VANISH]    Tables: ${result.tablesProcessed.join(', ')}`);
      console.log(`[VANISH]    Records deleted: ${result.recordsDeleted}`);
      console.log(`[VANISH]    Records anonymized: ${result.recordsAnonymized}`);
      console.log(`[VANISH]    Files deleted: ${result.filesDeleted.length}`);
      console.log(`[VANISH]    Duration: ${result.duration}ms`);
    } else {
      console.error(`[VANISH] ❌ Self-delete failed for ${user.email}: ${result.errorMessage}`);
    }

    return {
      success: result.success,
      message: result.success
        ? `Account deleted successfully. ${result.recordsDeleted} records removed.`
        : `Deletion failed: ${result.errorMessage}`,
      details: {
        tablesProcessed: result.tablesProcessed,
        recordsDeleted: result.recordsDeleted,
        recordsAnonymized: result.recordsAnonymized,
        filesDeleted: result.filesDeleted.length,
        duration: result.duration,
      },
    };
  },
});
