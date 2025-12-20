/**─────────────────────────────────────────────────────────────────────────┐
│  🛡️ S.I.D. Phase 15 - Admin Recovery Query                                │
│  /convex/domains/admin/users/queries/getClerkIdForRecovery.ts             │
│                                                                           │
│  Query to look up clerkId from identity registry for recovery.            │
│  Used by admin sendRecoveryLink server action.                            │
│                                                                           │
│  ⚠️ ADMIN ONLY: Requires admiral rank to access.                          │
└───────────────────────────────────────────────────────────────────────────┘ */

import { query } from "@/convex/_generated/server";
import { v } from "convex/values";
import { getClerkIdFromUserId } from "@/convex/identity/registry";

/**
 * Query to get clerkId from identity registry
 * Used by admin recovery link server action
 * Requires caller to be admiral rank
 */
export const getClerkIdForRecovery = query({
  args: {
    targetUserId: v.id("admin_users"),
    callerUserId: v.id("admin_users"),
  },
  handler: async (ctx, args): Promise<string | null> => {
    // Verify caller is admiral
    const caller = await ctx.db.get(args.callerUserId);
    if (!caller || caller.rank !== 'admiral') {
      throw new Error('Admin access required');
    }

    return await getClerkIdFromUserId(ctx.db, args.targetUserId);
  },
});
