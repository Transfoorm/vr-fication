/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PRODUCTIVITY DOMAIN QUERIES - SRS Layer 4                         │
│  /convex/domains/productivity/queries.ts                               │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All queries accept callerUserId: v.id("admin_users")                │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Rank-based data scoping for productivity tools:                       │
│  • Crew: Organization-scoped (read/write their org's data)             │
│  • Captain/Commodore: Organization-scoped (full access)                │
│  • Admiral: All data (cross-org, platform-wide)                        │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex query filters            │
└────────────────────────────────────────────────────────────────────────┘ */

import { query } from "@/convex/_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "@/convex/_generated/server";
import type { Id } from "@/convex/_generated/dataModel";

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
