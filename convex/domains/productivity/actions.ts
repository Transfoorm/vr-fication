/**─────────────────────────────────────────────────────────────────────────┐
│  🔌 PRODUCTIVITY DOMAIN ACTIONS - SRS Layer 4                             │
│  /convex/domains/productivity/actions.ts                                  │
│                                                                            │
│  Actions can read from Convex Storage (queries cannot).                   │
│  Used for email body retrieval - returns HTML content server-side.        │
│                                                                            │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                           │
│  - All actions accept callerUserId: v.id("admin_users")                   │
│  - No ctx.auth.getUserIdentity() usage                                    │
└────────────────────────────────────────────────────────────────────────────┘ */

import { action } from "@/convex/_generated/server";
import { v } from "convex/values";
import { internal } from "@/convex/_generated/api";

/**
 * 📄 GET EMAIL BODY (HTML Content)
 *
 * Reads email body HTML from Convex Storage server-side.
 * Returns the actual HTML content (not a URL).
 *
 * Actions can use ctx.storage.get() - queries cannot.
 *
 * @param callerUserId - Authenticated user ID
 * @param messageId - Convex document ID of email message
 * @returns { htmlContent: string | null, contentType: string }
 */
export const getEmailBody = action({
  args: {
    callerUserId: v.id("admin_users"),
    messageId: v.id("productivity_email_Index"),
  },
  handler: async (ctx, args): Promise<{ htmlContent: string | null; contentType: string }> => {
    // Get message metadata via internal query
    const messageData = await ctx.runQuery(
      internal.domains.productivity.internalQueries.getEmailMessageWithAsset,
      { callerUserId: args.callerUserId, messageId: args.messageId }
    );

    if (!messageData) {
      return { htmlContent: null, contentType: "text/plain" };
    }

    if (!messageData.storageId) {
      return { htmlContent: null, contentType: "text/plain" };
    }

    // Read blob content directly from storage (server-side)
    const blob = await ctx.storage.get(messageData.storageId);
    if (!blob) {
      return { htmlContent: null, contentType: "text/plain" };
    }

    // Convert blob to text and return HTML content
    const htmlContent = await blob.text();

    return {
      htmlContent,
      contentType: messageData.contentType || "text/html",
    };
  },
});
