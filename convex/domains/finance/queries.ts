/**──────────────────────────────────────────────────────────────────────┐
│  🔌 FINANCE DOMAIN QUERIES - SRS Layer 4                              │
│  /convex/domains/finance/queries.ts                                    │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All queries accept callerUserId: v.id("admin_users")                │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Rank-based data scoping for financial management:                     │
│  • Crew: Read-only, organization-scoped                                │
│  • Captain: Full access, organization-scoped                           │
│  • Commodore: Full access, organization-scoped                         │
│  • Admiral: All data (cross-org, platform-wide)                        │
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
 * List financial transactions with rank-based scoping
 */
export const listTransactions = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    let transactions;

    if (rank === "admiral") {
      transactions = await ctx.db.query("finance_banking_Statements").collect();
    } else {
      const orgId = user.orgSlug || "";
      transactions = await ctx.db
        .query("finance_banking_Statements")
        .withIndex("by_org", (q) => q.eq("orgId", orgId))
        .collect();
    }

    return transactions;
  },
});

/**
 * Get single transaction by ID with rank-based authorization
 */
export const getTransaction = query({
  args: { callerUserId: v.id("admin_users"), transactionId: v.id("finance_banking_Statements") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserWithRank(ctx, args.callerUserId);
    const rank = user.rank || "crew";

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) return null;

    if (rank === "admiral") {
      return transaction;
    } else {
      const orgId = user.orgSlug || "";
      if (transaction.orgId !== orgId) {
        throw new Error("Unauthorized: Transaction not in your organization");
      }
      return transaction;
    }
  },
});
