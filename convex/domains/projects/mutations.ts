/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PROJECT DOMAIN MUTATIONS - SRS Layer 4                            │
│  /convex/domains/projects/mutations.ts                                 │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All mutations accept callerUserId: v.id("admin_users")              │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Project CRUD with rank-based authorization:                           │
│  • Create: Captain/Commodore/Admiral only                              │
│  • Update: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Delete: Captain/Commodore/Admiral only (org-scoped)                 │
│  • Crew: Read-only access (cannot create/update/delete)                │
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
 * Create new project
 */
export const createProject = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    name: v.string(),
    description: v.optional(v.string()),
    orgId: v.optional(v.string()),
    assignedTo: v.optional(v.id("admin_users")),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("archived")
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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

    const projectId = await ctx.db.insert("projects_tracking_Schedule", {
      name: args.name,
      description: args.description,
      orgId,
      assignedTo: args.assignedTo,
      status: args.status,
      startDate: args.startDate,
      endDate: args.endDate,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, projectId };
  },
});

/**
 * Update existing project
 */
export const updateProject = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    projectId: v.id("projects_tracking_Schedule"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.id("admin_users")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (project.orgId !== orgId) {
        throw new Error("Unauthorized: Project not in your organization");
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.status !== undefined) updates.status = args.status;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.endDate !== undefined) updates.endDate = args.endDate;

    await ctx.db.patch(args.projectId, updates);

    return { success: true };
  },
});

/**
 * Delete project
 */
export const deleteProject = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    projectId: v.id("projects_tracking_Schedule"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (project.orgId !== orgId) {
        throw new Error("Unauthorized: Project not in your organization");
      }
    }

    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});
