/**─────────────────────────────────────────────────────────────────────────┐
│  🔒 PRODUCTIVITY INTERNAL QUERIES - Action Helpers                        │
│  /convex/domains/productivity/internalQueries.ts                          │
│                                                                            │
│  Internal queries called by actions. Not exposed to clients.              │
│  Actions can't access ctx.db directly, so they call these helpers.        │
│                                                                            │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                           │
└────────────────────────────────────────────────────────────────────────────┘ */

import { internalQuery } from "@/convex/_generated/server";
import { v } from "convex/values";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Get email message with asset info for body retrieval
 *
 * Called by getEmailBody action to get message metadata.
 * Returns storageId if body asset exists.
 */
export const getEmailMessageWithAsset = internalQuery({
  args: {
    callerUserId: v.id("admin_users"),
    messageId: v.id("productivity_email_Index"),
  },
  handler: async (ctx, args) => {
    // Get user for authorization
    const user = await ctx.db.get(args.callerUserId);
    if (!user) {
      return null;
    }

    const rank = user.rank || "crew";

    // Get the email message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return null;
    }

    // Check authorization (org-scoping)
    if (rank !== "admiral") {
      const orgId = user._id as string;
      if (message.orgId !== orgId) {
        return null;
      }
    }

    // If no body asset, return null storageId
    if (!message.bodyAssetId) {
      return { storageId: null, contentType: "text/plain" };
    }

    // Get the asset record
    const asset = await ctx.db.get(message.bodyAssetId as Id<"productivity_email_Assets">);
    if (!asset || !asset.storageId) {
      return { storageId: null, contentType: "text/plain" };
    }

    return {
      storageId: asset.storageId,
      contentType: asset.contentType || "text/html",
    };
  },
});
