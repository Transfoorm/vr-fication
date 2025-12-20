/**─────────────────────────────────────────────────────────────────────────┐
│  🔥 VANISH PROTOCOL 2.1 - UPDATE CLERK DELETION STATUS                    │
│  /convex/vanish/updateClerkDeletionStatus.ts                              │
│                                                                           │
│  Updates deletion audit log with Clerk deletion status after the          │
│  Action completes the Clerk API call.                                     │
│                                                                           │
│  Called by deleteAnyUserAction after Clerk deletion attempt.              │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";

/**
 * UPDATE CLERK DELETION STATUS IN AUDIT LOG
 *
 * Updates the most recent deletionLog entry for a user with
 * the result of the Clerk deletion attempt.
 *
 * @param targetClerkId - Clerk ID of deleted user
 * @param clerkDeleted - Whether Clerk deletion succeeded
 * @param clerkError - Error message if deletion failed
 */
export const updateClerkDeletionStatus = mutation({
  args: {
    targetClerkId: v.string(),
    clerkDeleted: v.boolean(),
    clerkError: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    // Find the most recent deletion log for this user
    // NOTE: by_clerk_id lookup is ACCEPTABLE here - this is called from Action
    // after Clerk API deletion, using clerkId for webhook correlation.
    // See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-6.3)
    const deletionLog = await ctx.db
      .query("admin_users_DeleteLog")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.targetClerkId))
      .order("desc")
      .first();

    if (!deletionLog) {
      console.error(`[VANISH] No deletion log found for ${args.targetClerkId}`);
      return;
    }

    // Update scope.clerkAccount and clerkDeletionError
    await ctx.db.patch(deletionLog._id, {
      scope: {
        ...deletionLog.scope,
        clerkAccount: args.clerkDeleted,
      },
      clerkDeletionError: args.clerkError,
    });

    console.log(`[VANISH] Updated audit log for ${args.targetClerkId}`);
    console.log(`[VANISH]    Clerk deleted: ${args.clerkDeleted}`);
    if (args.clerkError) {
      console.log(`[VANISH]    Clerk error: ${args.clerkError}`);
    }
  },
});
