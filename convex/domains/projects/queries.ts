/**──────────────────────────────────────────────────────────────────────┐
│  🔌 PROJECT DOMAIN QUERIES - SRS Layer 4                              │
│  /convex/domains/projects/queries.ts                                   │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All queries accept callerUserId: v.id("admin_users")                │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Rank-based data scoping for project management:                       │
│  • Crew: Assigned projects only                                        │
│  • Captain: Organization-scoped projects                               │
│  • Commodore: Organization-scoped projects                             │
│  • Admiral: All projects (cross-org, platform-wide)                    │
│                                                                        │
│  SRS Commandment #4: Data scoping via Convex query filters            │
└────────────────────────────────────────────────────────────────────────┘ */

import { query } from "@/convex/_generated/server";
import type { QueryCtx } from "@/convex/_generated/server";
import type { Id } from "@/convex/_generated/dataModel";
import { v } from "convex/values";

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
 * List projects with rank-based scoping
 */
export const listProjects = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    let projects;

    if (rank === "admiral") {
      projects = await ctx.db.query("projects_tracking_Schedule").collect();
    } else if (rank === "captain" || rank === "commodore") {
      const orgId = user.orgSlug || "";
      projects = await ctx.db
        .query("projects_tracking_Schedule")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    } else {
      projects = await ctx.db
        .query("projects_tracking_Schedule")
        .withIndex("by_assigned", (q) => q.eq("assignedTo", user._id))
        .collect();
    }

    return projects;
  },
});

/**
 * Get single project by ID with rank-based authorization
 */
export const getProject = query({
  args: { callerUserId: v.id("admin_users"), projectId: v.id("projects_tracking_Schedule") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    if (rank === "admiral") {
      return project;
    } else if (rank === "captain" || rank === "commodore") {
      const orgId = user.orgSlug || "";
      if (project.orgId !== orgId) {
        throw new Error("Unauthorized: Project not in your organization");
      }
      return project;
    } else {
      if (project.assignedTo?.toString() !== user._id.toString()) {
        throw new Error("Unauthorized: Project not assigned to you");
      }
      return project;
    }
  },
});
