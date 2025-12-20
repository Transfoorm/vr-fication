/**──────────────────────────────────────────────────────────────────────┐
│  🔌 FINANCE DOMAIN MUTATIONS - SRS Layer 4                            │
│  /convex/domains/finance/mutations.ts                                  │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All mutations accept callerUserId: v.id("admin_users")              │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Financial transaction CRUD with rank-based authorization:             │
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
 * Create new financial transaction
 */
export const createTransaction = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    type: v.union(
      v.literal("invoice"),
      v.literal("payment"),
      v.literal("expense")
    ),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    orgId: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("overdue")
      )
    ),
    date: v.number(),
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

    const transactionId = await ctx.db.insert("finance_banking_Statements", {
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      orgId,
      status: args.status || "pending",
      date: args.date,
      createdAt: now,
      updatedAt: now,
      createdBy: user._id,
    });

    return { success: true, transactionId };
  },
});

/**
 * Update existing financial transaction
 */
export const updateTransaction = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    transactionId: v.id("finance_banking_Statements"),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("paid"),
        v.literal("overdue")
      )
    ),
    date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (transaction.orgId !== orgId) {
        throw new Error("Unauthorized: Transaction not in your organization");
      }
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.amount !== undefined) updates.amount = args.amount;
    if (args.currency !== undefined) updates.currency = args.currency;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.date !== undefined) updates.date = args.date;

    await ctx.db.patch(args.transactionId, updates);

    return { success: true };
  },
});

/**
 * Delete financial transaction
 */
export const deleteTransaction = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    transactionId: v.id("finance_banking_Statements"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    requireCaptainOrHigher(rank);

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (rank !== "admiral") {
      const orgId = user.orgSlug || "";
      if (transaction.orgId !== orgId) {
        throw new Error("Unauthorized: Transaction not in your organization");
      }
    }

    await ctx.db.delete(args.transactionId);

    return { success: true };
  },
});
