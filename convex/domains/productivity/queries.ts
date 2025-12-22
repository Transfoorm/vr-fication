/**─────────────────────────────────────────────────────────────────────────┐
│  🔌 PRODUCTIVITY DOMAIN QUERIES - SRS Layer 4                             │
│  /convex/domains/productivity/queries.ts                                  │
│                                                                           │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                           │
│  - All queries accept callerUserId: v.id("admin_users")                   │
│  - No ctx.auth.getUserIdentity() usage                                    │
│                                                                           │
│  Rank-based data scoping for productivity tools:                          │
│  • Crew: Organization-scoped (read/write their org's data)                │
│  • Captain/Commodore: Organization-scoped (full access)                   │
│  • Admiral: All data (cross-org, platform-wide)                           │
│                                                                           │
│  SRS Commandment #4: Data scoping via Convex query filters                │
└───────────────────────────────────────────────────────────────────────────┘ */

import { query } from "@/convex/_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "@/convex/_generated/server";
import type { Id } from "@/convex/_generated/dataModel";
import {
  groupMessagesByThread,
  computeThreadMetadata,
  type ThreadMetadata,
} from "./helpers/threadState";

/**
 * 🛡️ SID Phase 10: Sovereign user lookup by userId
 */
async function getCurrentUserWithRank(ctx: QueryCtx, callerUserId: Id<"admin_users">) {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const user = await ctx.db.get(callerUserId);
  if (!user) throw new Error("User not found");
  return user;
}

/**
 * List email messages with rank-based scoping
 */
export const listEmails = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    if (rank === "admiral") {
      return await ctx.db.query("productivity_email_Messages").collect();
    } else {
      const orgId = user.orgSlug || "";
      return await ctx.db
        .query("productivity_email_Messages")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }
  },
});

/**
 * List calendar events with rank-based scoping
 */
export const listCalendarEvents = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    if (rank === "admiral") {
      return await ctx.db.query("productivity_calendar_Events").collect();
    } else {
      const orgId = user.orgSlug || "";
      return await ctx.db
        .query("productivity_calendar_Events")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }
  },
});

/**
 * List bookings with rank-based scoping
 */
export const listBookings = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    if (rank === "admiral") {
      return await ctx.db.query("productivity_bookings_Form").collect();
    } else {
      const orgId = user.orgSlug || "";
      return await ctx.db
        .query("productivity_bookings_Form")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }
  },
});

/**
 * List meetings with rank-based scoping
 */
export const listMeetings = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    if (rank === "admiral") {
      return await ctx.db.query("productivity_pipeline_Prospects").collect();
    } else {
      const orgId = user.orgSlug || "";
      return await ctx.db
        .query("productivity_pipeline_Prospects")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }
  },
});

// ═══════════════════════════════════════════════════════════════════════
// EMAIL INTAKE QUERIES
// ═══════════════════════════════════════════════════════════════════════

/**
 * 📧 GET THREAD STATE (Single Thread)
 *
 * Returns thread state + metadata for a specific email thread.
 *
 * DOCTRINE:
 * - Thread state is DERIVED (not stored)
 * - Uses deriveThreadState() pure function
 * - Computes metadata from constituent messages
 *
 * @param threadId - External thread ID (Gmail/Outlook thread ID)
 * @returns Thread metadata with derived state
 */
export const getThreadState = query({
  args: {
    callerUserId: v.id("admin_users"),
    threadId: v.string(), // externalThreadId from Gmail/Outlook
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    // Fetch all messages in thread
    let messages;
    if (rank === "admiral") {
      messages = await ctx.db
        .query("productivity_email_Index")
        .withIndex("by_external_thread_id", (q) => q.eq("externalThreadId", args.threadId))
        .collect();
    } else {
      const orgId = user.orgSlug || "";
      messages = await ctx.db
        .query("productivity_email_Index")
        .withIndex("by_external_thread_id", (q) => q.eq("externalThreadId", args.threadId))
        .filter((q) => q.eq(q.field("orgId"), orgId))
        .collect();
    }

    if (messages.length === 0) {
      return null;
    }

    // Compute thread metadata (includes derived state)
    const currentUserEmail = user.email;
    const metadata = computeThreadMetadata(messages, currentUserEmail);

    return {
      ...metadata,
      messages, // Include full message details
    };
  },
});

/**
 * 📬 LIST THREADS (Inbox View)
 *
 * Returns all email threads with derived states, grouped and filtered.
 *
 * DOCTRINE:
 * - Thread state is DERIVED on-the-fly (not stored)
 * - Supports filtering by state (awaiting_me, awaiting_them, resolved, none)
 * - Sorted by latest message descending (most recent first)
 * - <50ms render target (WARP preloads this into FUSE)
 *
 * @param stateFilter - Optional filter by thread state
 * @returns Array of thread metadata sorted by latest message
 */
export const listThreads = query({
  args: {
    callerUserId: v.id("admin_users"),
    stateFilter: v.optional(
      v.union(
        v.literal("awaiting_me"),
        v.literal("awaiting_them"),
        v.literal("resolved"),
        v.literal("none")
      )
    ),
    limit: v.optional(v.number()), // Optional limit (default: all)
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";
    const currentUserEmail = user.email;

    // Fetch all email index messages with rank-based scoping
    let allMessages;
    if (rank === "admiral") {
      allMessages = await ctx.db
        .query("productivity_email_Index")
        .order("desc") // Most recent first
        .collect();
    } else {
      // 🛡️ SID-ORG: Use userId directly until orgs domain is implemented
      const orgId = user._id as string;
      allMessages = await ctx.db
        .query("productivity_email_Index")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .order("desc")
        .collect();
    }

    // Group messages by thread
    const threadMap = groupMessagesByThread(allMessages);

    // Compute metadata for each thread
    const threads: ThreadMetadata[] = [];
    for (const [, messages] of threadMap) {
      const metadata = computeThreadMetadata(messages, currentUserEmail);

      // Apply state filter if provided
      if (args.stateFilter && metadata.state !== args.stateFilter) {
        continue;
      }

      threads.push(metadata);
    }

    // Sort by latest message descending (most recent first)
    threads.sort((a, b) => b.latestMessageAt - a.latestMessageAt);

    // Apply limit if provided
    if (args.limit && args.limit > 0) {
      return threads.slice(0, args.limit);
    }

    return threads;
  },
});

/**
 * 📨 LIST EMAIL MESSAGES (All Messages)
 *
 * Returns all email messages from productivity_email_Index with rank-based scoping.
 * Used by WARP to preload email data into FUSE store.
 *
 * @returns Array of email messages
 */
export const listMessages = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    // Fetch all email messages with rank-based scoping
    if (rank === "admiral") {
      return await ctx.db
        .query("productivity_email_Index")
        .order("desc") // Most recent first
        .collect();
    } else {
      // 🛡️ SID-ORG: Use userId directly until orgs domain is implemented
      const orgId = user._id as string;
      return await ctx.db
        .query("productivity_email_Index")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .order("desc")
        .collect();
    }
  },
});

/**
 * 📨 GET EMAIL MESSAGE (Single Message Details)
 *
 * Returns full details for a specific email message.
 *
 * @param messageId - Convex document ID of email message
 * @returns Email message with all fields
 */
export const getEmailMessage = query({
  args: {
    callerUserId: v.id("admin_users"),
    messageId: v.id("productivity_email_Index"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Check authorization (org-scoping)
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (message.orgId !== orgId) {
        throw new Error("Unauthorized: Message not in your organization");
      }
    }

    return message;
  },
});

// TODO: Implement getEmailBody as action with internal query helper
// Requires splitting DB access (query) from storage access (action)
// Deferred until assets.ts pipeline is implemented

/**
 * 📧 LIST EMAIL ACCOUNTS (Connected Accounts)
 *
 * Returns all connected email accounts for current user.
 *
 * @returns Array of connected email accounts
 */
export const listEmailAccounts = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    // Email accounts are always user-scoped (not org-scoped)
    // Users can only see their own connected accounts
    if (rank === "admiral") {
      // Admiral can see all accounts (for admin purposes)
      return await ctx.db.query("productivity_email_Accounts").collect();
    } else {
      // Regular users see only their own accounts
      return await ctx.db
        .query("productivity_email_Accounts")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();
    }
  },
});
