/**─────────────────────────────────────────────────────────────────────────┐
│  🛡️ S.I.D. Phase 15 - VANISH Internal Query                              │
│  /convex/vanish/getClerkIdForDeletion.ts                                  │
│                                                                           │
│  Internal query to look up clerkId from identity registry for deletion.  │
│  Used by deleteAnyUserWithClerkV2 action.                                 │
│                                                                           │
│  ⚠️ QUARANTINED: This query exists ONLY for VANISH deletion flows.       │
│  Do NOT use this query for any other purpose.                            │
└───────────────────────────────────────────────────────────────────────────┘ */

import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";
import { getClerkIdFromUserId } from "@/convex/identity/registry";

/**
 * Internal query to get clerkId from identity registry
 * Used by VANISH deleteAnyUserWithClerkV2 action
 */
export const getClerkIdForDeletion = internalQuery({
  args: {
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args): Promise<string | null> => {
    return await getClerkIdFromUserId(ctx.db, args.userId);
  },
});
