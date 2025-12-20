/**─────────────────────────────────────────────────────────────────────────┐
│  🗑️  DELETE DELETION LOG (Admiral-only)                                   │
│  /convex/vanish/deleteDeletionLog.ts                                      │
│                                                                           │
│  Allows Admirals to manually delete VANISH Journal entries.               │
│  Use cases: Testing cleanup, manual corrections, etc.                     │
│                                                                           │
│  SAFETY:                                                                  │
│  - Admiral rank required                                                  │
│  - Permanent deletion (no soft-delete)                                    │
│  - No meta-audit (deleting audit logs is sensitive)                       │
│                                                                           │
│  NOTE: Deleting audit logs should be rare. Consider the compliance        │
│  implications before using this feature.                                  │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { getUserIdFromClerkId } from "@/convex/identity/registry";

/**
 * DELETE DELETION LOG ENTRY
 *
 * Permanently deletes a VANISH Journal entry.
 * Admiral-only operation.
 *
 * @param logId - ID of deletionLog entry to delete
 * @returns Success status
 */
export const deleteDeletionLog = mutation({
  args: {
    logId: v.id("admin_users_DeleteLog"),
    callerClerkId: v.string(),  // 🔱 SOVEREIGN: Identity from FUSE session cookie
  },

  handler: async (ctx, args) => {
    // ═══════════════════════════════════════════════════════════════
    // 1. VALIDATE CALLER IDENTITY (from FUSE session cookie)
    // ═══════════════════════════════════════════════════════════════

    const callerClerkId = args.callerClerkId;
    if (!callerClerkId) {
      throw new Error("[VANISH JOURNAL] Unauthenticated: No caller identity provided");
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. VERIFY ADMIRAL RANK
    // 🛡️ S.I.D. Phase 14: Use identity registry for Clerk→Convex lookup
    // ═══════════════════════════════════════════════════════════════

    const callerUserId = await getUserIdFromClerkId(ctx.db, callerClerkId);
    if (!callerUserId) {
      throw new Error(
        `[VANISH JOURNAL] Caller not found in registry: No mapping for ${callerClerkId}`
      );
    }

    const caller = await ctx.db.get(callerUserId);
    if (!caller) {
      throw new Error(
        `[VANISH JOURNAL] Caller not found: No Convex user record for ${callerUserId}`
      );
    }

    if (caller.rank !== "admiral") {
      throw new Error(
        `[VANISH JOURNAL] Unauthorized: Only Admiral rank can delete journal entries (current rank: ${caller.rank || 'none'})`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. GET LOG ENTRY
    // ═══════════════════════════════════════════════════════════════

    const log = await ctx.db.get(args.logId);

    if (!log) {
      throw new Error(
        `[VANISH JOURNAL] Log entry not found: ${args.logId}`
      );
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. DELETE LOG ENTRY
    // ═══════════════════════════════════════════════════════════════

    console.log(`[VANISH JOURNAL] 🗑️  Admiral ${caller.email} deleting log entry:`);
    console.log(`[VANISH JOURNAL]    Log ID: ${args.logId}`);
    console.log(`[VANISH JOURNAL]    Original user: ${log.email}`);
    console.log(`[VANISH JOURNAL]    Deletion date: ${new Date(log.deletedAt).toISOString()}`);

    await ctx.db.delete(args.logId);

    console.log(`[VANISH JOURNAL] ✅ Log entry deleted successfully`);

    return {
      success: true,
      message: `VANISH Journal entry for ${log.email} deleted successfully`,
    };
  },
});
