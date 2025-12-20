/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PRODUCTIVITY DOMAIN MUTATIONS - SRS Layer 4                       │
│  /convex/domains/productivity/mutations.ts                             │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All mutations accept callerUserId: v.id("admin_users")              │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Productivity domain CRUD with rank-based authorization:               │
│  • Create: Captain/Commodore/Admiral only                              │
│  • Update: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Delete: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Crew: Organization-scoped access (can create/update their org)      │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex mutations                │
└────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import type { MutationCtx } from "@/convex/_generated/server";
import type { Id } from "@/convex/_generated/dataModel";
import { v } from "convex/values";

/**
 * 🛡️ SID Phase 10: Sovereign user lookup by userId
 */
async function getCurrentUserWithRank(ctx: MutationCtx, callerUserId: Id<"admin_users">) {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const user = await ctx.db.get(callerUserId);
  if (!user) throw new Error("User not found");
  return user;
}

// ═══════════════════════════════════════════════════════════════════════
// EMAIL MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

export const createEmail = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    subject: v.string(),
    body: v.string(),
    from: v.string(),
    to: v.array(v.string()),
    status: v.union(v.literal("draft"), v.literal("sent"), v.literal("archived")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const orgId = user.orgSlug || "";
    const now = Date.now();

    const emailId = await ctx.db.insert("productivity_email_Messages", {
      subject: args.subject,
      body: args.body,
      from: args.from,
      to: args.to,
      status: args.status,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, emailId };
  },
});

export const updateEmail = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    emailId: v.id("productivity_email_Messages"),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (email.orgId !== orgId) {
        throw new Error("Unauthorized: Email not in your organization");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.body !== undefined) updates.body = args.body;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.emailId, updates);
    return { success: true };
  },
});

export const deleteEmail = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    emailId: v.id("productivity_email_Messages")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const email = await ctx.db.get(args.emailId);
    if (!email) throw new Error("Email not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (email.orgId !== orgId) {
        throw new Error("Unauthorized: Email not in your organization");
      }
    }

    await ctx.db.delete(args.emailId);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

export const createCalendarEvent = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    title: v.string(),
    description: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.number(),
    attendees: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const orgId = user.orgSlug || "";
    const now = Date.now();

    const eventId = await ctx.db.insert("productivity_calendar_Events", {
      title: args.title,
      description: args.description,
      startTime: args.startTime,
      endTime: args.endTime,
      attendees: args.attendees,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, eventId };
  },
});

export const updateCalendarEvent = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    eventId: v.id("productivity_calendar_Events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    attendees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (event.orgId !== orgId) {
        throw new Error("Unauthorized: Event not in your organization");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.startTime !== undefined) updates.startTime = args.startTime;
    if (args.endTime !== undefined) updates.endTime = args.endTime;
    if (args.attendees !== undefined) updates.attendees = args.attendees;

    await ctx.db.patch(args.eventId, updates);
    return { success: true };
  },
});

export const deleteCalendarEvent = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    eventId: v.id("productivity_calendar_Events")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (event.orgId !== orgId) {
        throw new Error("Unauthorized: Event not in your organization");
      }
    }

    await ctx.db.delete(args.eventId);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// BOOKING MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

export const createBooking = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    clientName: v.string(),
    serviceType: v.string(),
    scheduledTime: v.number(),
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const orgId = user.orgSlug || "";
    const now = Date.now();

    const bookingId = await ctx.db.insert("productivity_bookings_Form", {
      clientName: args.clientName,
      serviceType: args.serviceType,
      scheduledTime: args.scheduledTime,
      status: args.status,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, bookingId };
  },
});

export const updateBooking = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    bookingId: v.id("productivity_bookings_Form"),
    clientName: v.optional(v.string()),
    serviceType: v.optional(v.string()),
    scheduledTime: v.optional(v.number()),
    status: v.optional(v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (booking.orgId !== orgId) {
        throw new Error("Unauthorized: Booking not in your organization");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.clientName !== undefined) updates.clientName = args.clientName;
    if (args.serviceType !== undefined) updates.serviceType = args.serviceType;
    if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
    if (args.status !== undefined) updates.status = args.status;

    await ctx.db.patch(args.bookingId, updates);
    return { success: true };
  },
});

export const deleteBooking = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    bookingId: v.id("productivity_bookings_Form")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (booking.orgId !== orgId) {
        throw new Error("Unauthorized: Booking not in your organization");
      }
    }

    await ctx.db.delete(args.bookingId);
    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// MEETING MUTATIONS
// ═══════════════════════════════════════════════════════════════════════

export const createMeeting = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    title: v.string(),
    participants: v.array(v.string()),
    scheduledTime: v.number(),
    duration: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const orgId = user.orgSlug || "";
    const now = Date.now();

    const meetingId = await ctx.db.insert("productivity_pipeline_Prospects", {
      title: args.title,
      participants: args.participants,
      scheduledTime: args.scheduledTime,
      duration: args.duration,
      notes: args.notes,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, meetingId };
  },
});

export const updateMeeting = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    meetingId: v.id("productivity_pipeline_Prospects"),
    title: v.optional(v.string()),
    participants: v.optional(v.array(v.string())),
    scheduledTime: v.optional(v.number()),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (meeting.orgId !== orgId) {
        throw new Error("Unauthorized: Meeting not in your organization");
      }
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.participants !== undefined) updates.participants = args.participants;
    if (args.scheduledTime !== undefined) updates.scheduledTime = args.scheduledTime;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.meetingId, updates);
    return { success: true };
  },
});

export const deleteMeeting = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    meetingId: v.id("productivity_pipeline_Prospects")
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const meeting = await ctx.db.get(args.meetingId);
    if (!meeting) throw new Error("Meeting not found");

    const rank = user.rank || "crew";
    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (meeting.orgId !== orgId) {
        throw new Error("Unauthorized: Meeting not in your organization");
      }
    }

    await ctx.db.delete(args.meetingId);
    return { success: true };
  },
});
