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
 * Strip wrapper divs that were added by the old HTML normalizer.
 * Old emails may have been stored with constraining wrapper elements.
 * This cleans them up at read time.
 *
 * Detection: If the email starts with <div (not a table or doctype),
 * and ends with </div>, and the inner content starts with a table/doctype,
 * then it was likely wrapped.
 */
function stripLegacyWrappers(html: string): string {
  const trimmed = html.trim();

  // Most emails start with <!DOCTYPE, <html, or <table
  // If it starts with <div and wraps everything, it's likely our wrapper
  if (!trimmed.toLowerCase().startsWith('<div')) {
    return html; // Not wrapped
  }

  // Check if this is a single wrapper div around the whole email
  // Pattern: <div...>CONTENT</div> where CONTENT contains the real email
  const wrapperPattern = /^<div[^>]*>([\s\S]*)<\/div>$/i;
  const match = trimmed.match(wrapperPattern);

  if (!match) {
    return html; // Not a simple wrapper
  }

  const innerContent = match[1].trim();

  // Verify the inner content looks like real email HTML
  // (starts with doctype, html, head, body, table, or another structural element)
  const looksLikeEmail = /^(<!DOCTYPE|<html|<head|<body|<table|<center)/i.test(innerContent);

  if (looksLikeEmail) {
    console.log('[Email] Stripped legacy wrapper div');
    return innerContent;
  }

  // Inner content doesn't look like a full email, might be legit div structure
  return html;
}

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

    // Convert blob to text
    const rawHtml = await blob.text();

    // Strip legacy wrappers that may have been added by old normalizer
    const htmlContent = stripLegacyWrappers(rawHtml);

    return {
      htmlContent,
      contentType: messageData.contentType || "text/html",
    };
  },
});
