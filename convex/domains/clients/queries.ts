/**──────────────────────────────────────────────────────────────────────┐
│  🔌 CLIENT DOMAIN QUERIES - SRS Layer 4                               │
│  /convex/domains/clients/queries.ts                                    │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All queries accept callerUserId: v.id("admin_users")                │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Rank-based data scoping for client management:                        │
│  • Crew: Assigned clients only (by_assigned index)                     │
│  • Captain: Organization-scoped clients (by_org index)                 │
│  • Commodore: Organization-scoped clients (by_org index)               │
│  • Admiral: All clients (cross-org, platform-wide)                     │
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
 * List clients with rank-based scoping
 */
export const listClients = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    let clients;

    if (rank === "admiral") {
      clients = await ctx.db.query("clients_contacts_Users").collect();
    } else if (rank === "captain" || rank === "commodore") {
      const orgId = user.orgSlug || "";
      clients = await ctx.db
        .query("clients_contacts_Users")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    } else {
      clients = await ctx.db
        .query("clients_contacts_Users")
        .withIndex("by_assigned", (q) => q.eq("assignedTo", user._id))
        .collect();
    }

    return clients;
  },
});

/**
 * Get single client by ID with rank-based authorization
 */
export const getClient = query({
  args: { callerUserId: v.id("admin_users"), clientId: v.id("clients_contacts_Users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    const client = await ctx.db.get(args.clientId);
    if (!client) return null;

    if (rank === "admiral") {
      return client;
    } else if (rank === "captain" || rank === "commodore") {
      const orgId = user.orgSlug || "";
      if (client.orgId !== orgId) {
        throw new Error("Unauthorized: Client not in your organization");
      }
      return client;
    } else {
      if (client.assignedTo?.toString() !== user._id.toString()) {
        throw new Error("Unauthorized: Client not assigned to you");
      }
      return client;
    }
  },
});
