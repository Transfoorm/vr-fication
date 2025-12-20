/**──────────────────────────────────────────────────────────────────────┐
│  📊 SUBSCRIPTION STATS QUERY - Admiral Dashboard                       │
│  /convex/domains/admin/users/queries/subscriptionStats.ts              │
│                                                                        │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                       │
│  - All queries accept callerUserId: v.id("admin_users")                │
│  - No ctx.auth.getUserIdentity() usage                                 │
│                                                                        │
│  Provides subscription and rank statistics for the Admiral Rank        │
│  Management tab. Shows counts, breakdowns, and metrics.                │
└────────────────────────────────────────────────────────────────────────┘ */

import { query } from "@/convex/_generated/server";
import { requireAdmiralRank } from "@/convex/system/utils/rankAuth";
import { getTrialDaysRemaining } from "@/fuse/constants/ranks";
import { v } from "convex/values";

// ═══════════════════════════════════════════════════════════════════════
// GET SUBSCRIPTION STATS (Admiral-only)
// ═══════════════════════════════════════════════════════════════════════

export const getSubscriptionStats = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    // Get all admin_users
    const allUsers = await ctx.db.query("admin_users").collect();

    // Initialize counters
    const stats = {
      total: allUsers.length,
      byRank: {
        crew: 0,
        captain: 0,
        commodore: 0,
        admiral: 0,
      },
      bySubscription: {
        trial: 0,
        active: 0,
        expired: 0,
        lifetime: 0,
        cancelled: 0,
        unknown: 0,
      },
      trialDetails: {
        activeTrials: 0,
        expiringSoon: 0, // Expiring in next 3 days
        inGracePeriod: 0,
      },
    };

    // Count admin_users by rank and subscription
    const now = Date.now();

    for (const user of allUsers) {
      // Count by rank
      const rank = user.rank || "crew";
      stats.byRank[rank]++;

      // Count by subscription status
      const status = user.subscriptionStatus || "unknown";
      if (status === "trial") {
        stats.bySubscription.trial++;
        stats.trialDetails.activeTrials++;

        // Check if expiring soon (within 3 days)
        const daysRemaining = getTrialDaysRemaining(user.trialEndsAt);
        if (daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3) {
          stats.trialDetails.expiringSoon++;
        }
      } else if (status === "active") {
        stats.bySubscription.active++;
      } else if (status === "expired") {
        stats.bySubscription.expired++;

        // Check if in grace period
        if (user.trialEndsAt) {
          const gracePeriodEnd = user.trialEndsAt + (3 * 24 * 60 * 60 * 1000);
          if (now > user.trialEndsAt && now < gracePeriodEnd) {
            stats.trialDetails.inGracePeriod++;
          }
        }
      } else if (status === "lifetime") {
        stats.bySubscription.lifetime++;
      } else if (status === "cancelled") {
        stats.bySubscription.cancelled++;
      } else {
        stats.bySubscription.unknown++;
      }
    }

    return stats;
  },
});

// ═══════════════════════════════════════════════════════════════════════
// GET TRIAL EXPIRATION LIST (Admiral-only)
// ═══════════════════════════════════════════════════════════════════════

export const getExpiringTrials = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    // Get all admin_users on trial
    const trialUsers = await ctx.db
      .query("admin_users")
      .withIndex("by_subscription_status", (q) => q.eq("subscriptionStatus", "trial"))
      .collect();

    // Filter and sort by expiration date
    // 🛡️ S.I.D. Phase 15: clerkId removed from domain query returns
    const expiring = trialUsers
      .map((user) => {
        const daysRemaining = getTrialDaysRemaining(user.trialEndsAt);
        return {
          _id: user._id,
          // clerkId removed per SID-15.3
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          trialEndsAt: user.trialEndsAt,
          daysRemaining,
          expiringSoon: daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 3,
        };
      })
      .filter((u) => u.daysRemaining !== null && u.daysRemaining > 0)
      .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

    return expiring;
  },
});

// ═══════════════════════════════════════════════════════════════════════
// GET RANK DISTRIBUTION (Admiral-only)
// ═══════════════════════════════════════════════════════════════════════

export const getRankDistribution = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Verify Admiral rank using sovereign callerUserId
    await requireAdmiralRank(ctx, args.callerUserId);

    // Get all admin_users
    const allUsers = await ctx.db.query("admin_users").collect();

    // Count by rank
    const distribution = allUsers.reduce(
      (acc, user) => {
        const rank = user.rank || "crew";
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      crew: distribution.crew || 0,
      captain: distribution.captain || 0,
      commodore: distribution.commodore || 0,
      admiral: distribution.admiral || 0,
      total: allUsers.length,
    };
  },
});
