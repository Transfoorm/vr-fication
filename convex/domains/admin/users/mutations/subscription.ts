/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ SUBSCRIPTION MUTATIONS - Admiral Controls                          │
│  /convex/domains/admin/users/mutations/subscription.ts                 │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All mutations accept callerUserId: v.id("admin_users")              │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Admiral-only mutations for managing user trials, subscriptions,       │
│  and rank assignments. Part of the Rank-Aware Management System.       │
│                                                                        │
│  God Mode: Admiral has complete control over all subscription          │
│  settings, trial periods, and lifetime grants.                         │
└────────────────────────────────────────────────────────────────────────┘ */

import { v } from "convex/values";
import { mutation } from "@/convex/_generated/server";
import { requireAdmiralRank } from "@/convex/system/utils/rankAuth";
import { calculateTrialEndDate } from "@/fuse/constants/ranks";

// ═══════════════════════════════════════════════════════════════════════
// SET USER TRIAL (Admiral grants/extends trial for specific user)
// ═══════════════════════════════════════════════════════════════════════

export const setUserTrial = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userId: v.id("admin_users"),
    durationDays: v.number(),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const trialEndsAt = calculateTrialEndDate(args.durationDays, now);

    await ctx.db.patch(args.userId, {
      subscriptionStatus: "trial",
      trialStartedAt: now,
      trialEndsAt,
      trialDuration: args.durationDays,
      updatedAt: now,
    });

    return {
      success: true,
      trialEndsAt,
      daysGranted: args.durationDays,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// EXTEND USER TRIAL (Admiral adds days to existing trial)
// ═══════════════════════════════════════════════════════════════════════

export const extendUserTrial = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userId: v.id("admin_users"),
    additionalDays: v.number(),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.subscriptionStatus !== "trial") {
      throw new Error("User is not on a trial subscription");
    }

    const now = Date.now();
    const currentEndsAt = user.trialEndsAt || now;
    const newEndsAt = currentEndsAt + (args.additionalDays * 24 * 60 * 60 * 1000);
    const newDuration = (user.trialDuration || 0) + args.additionalDays;

    await ctx.db.patch(args.userId, {
      trialEndsAt: newEndsAt,
      trialDuration: newDuration,
      updatedAt: now,
    });

    return {
      success: true,
      newTrialEndsAt: newEndsAt,
      totalDuration: newDuration,
      daysAdded: args.additionalDays,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// SET USER SUBSCRIPTION (Admiral sets subscription status)
// ═══════════════════════════════════════════════════════════════════════

export const setUserSubscription = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userId: v.id("admin_users"),
    status: v.union(
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("lifetime"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const updates: Partial<typeof user> = {
      subscriptionStatus: args.status,
      updatedAt: now,
    };

    // If setting to lifetime, clear trial fields
    if (args.status === "lifetime") {
      updates.trialEndsAt = undefined;
      updates.subscriptionStartedAt = now;
    }

    // If setting to active, set subscription start date
    if (args.status === "active") {
      updates.subscriptionStartedAt = now;
    }

    await ctx.db.patch(args.userId, updates);

    return {
      success: true,
      newStatus: args.status,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// GRANT LIFETIME ACCESS (Admiral gives permanent access)
// ═══════════════════════════════════════════════════════════════════════

export const grantLifetimeAccess = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.userId, {
      subscriptionStatus: "lifetime",
      rank: "captain", // Ensure they have Captain access
      trialEndsAt: undefined, // Remove trial expiration
      trialStartedAt: undefined,
      trialDuration: undefined,
      subscriptionStartedAt: now,
      updatedAt: now,
    });

    return {
      success: true,
      message: `Lifetime access granted to ${user.firstName} ${user.lastName}`,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// SET USER RANK (Admiral changes user rank)
// ═══════════════════════════════════════════════════════════════════════

export const setUserRank = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userId: v.id("admin_users"),
    rank: v.union(
      v.literal("crew"),
      v.literal("captain"),
      v.literal("commodore"),
      v.literal("admiral")
    ),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();

    await ctx.db.patch(args.userId, {
      rank: args.rank,
      updatedAt: now,
    });

    return {
      success: true,
      newRank: args.rank,
      message: `${user.firstName} ${user.lastName} promoted to ${args.rank}`,
    };
  },
});

// ═══════════════════════════════════════════════════════════════════════
// BULK SET SUBSCRIPTION (Admiral updates multiple admin_users at once)
// ═══════════════════════════════════════════════════════════════════════

export const bulkSetSubscription = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    userIds: v.array(v.id("admin_users")),
    status: v.union(
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired"),
      v.literal("lifetime"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    const now = Date.now();
    const results = [];

    for (const userId of args.userIds) {
      try {
        const user = await ctx.db.get(userId);
        if (!user) {
          results.push({ userId, success: false, error: "User not found" });
          continue;
        }

        const updates: Partial<typeof user> = {
          subscriptionStatus: args.status,
          updatedAt: now,
        };

        // If setting to lifetime, clear trial fields
        if (args.status === "lifetime") {
          updates.trialEndsAt = undefined;
          updates.subscriptionStartedAt = now;
        }

        await ctx.db.patch(userId, updates);
        results.push({ userId, success: true });
      } catch (error) {
        results.push({ userId, success: false, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return {
      success: true,
      total: args.userIds.length,
      updated: successCount,
      failed: args.userIds.length - successCount,
      results,
    };
  },
});
