/**──────────────────────────────────────────────────────────────────────┐
│  🔌 CLIENT DOMAIN MUTATIONS - SRS Layer 4                             │
│  /convex/domains/clients/mutations.ts                                  │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All mutations accept callerUserId: v.id("admin_users")              │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Client CRUD operations with rank-based authorization:                 │
│  • Create: Captain/Commodore/Admiral only                              │
│  • Update: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Delete: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Crew: Cannot create/update/delete (read-only access)                │
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

/**
 * Require minimum rank for mutations (Captain or higher)
 */
function requireCaptainOrHigher(rank: string | undefined) {
  if (rank === "crew") {
    throw new Error("Unauthorized: Captain rank or higher required");
  }
}

/**
 * Create new client
 */
export const createClient = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    orgId: v.optional(v.string()),
    assignedTo: v.optional(v.id("admin_users")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("prospect"),
        v.literal("archived")
      )
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    let orgId: string;
    if (rank === "admiral" && args.orgId) {
      orgId = args.orgId;
    } else {
      orgId = user.orgSlug || "";
    }

    const now = Date.now();

    const clientId = await ctx.db.insert("clients_contacts_Users", {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      company: args.company,
      jobTitle: args.jobTitle,
      phoneNumber: args.phoneNumber,
      orgId,
      assignedTo: args.assignedTo,
      status: args.status || "active",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, clientId };
  },
});

/**
 * Update existing client
 */
export const updateClient = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    clientId: v.id("clients_contacts_Users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    assignedTo: v.optional(v.id("admin_users")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("prospect"),
        v.literal("archived")
      )
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (client.orgId !== orgId) {
        throw new Error("Unauthorized: Client not in your organization");
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.email !== undefined) updates.email = args.email;
    if (args.company !== undefined) updates.company = args.company;
    if (args.jobTitle !== undefined) updates.jobTitle = args.jobTitle;
    if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.status !== undefined) updates.status = args.status;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.clientId, updates);

    return { success: true };
  },
});

/**
 * Delete client
 */
export const deleteClient = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    clientId: v.id("clients_contacts_Users"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (client.orgId !== orgId) {
        throw new Error("Unauthorized: Client not in your organization");
      }
    }

    await ctx.db.delete(args.clientId);

    return { success: true };
  },
});
