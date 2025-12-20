/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ FUSE Rank Authentication Utilities                                 │
│  /convex/system/utils/rankAuth.ts                                      │
│                                                                        │
│  Hierarchy: Admiral > Commodore > Captain > Crew                       │
│                                                                        │
│  🛡️ SID-5.3 COMPLIANT: All functions accept userId: Id<"admin_users"> │
│  Sovereign identity lookup via ctx.db.get()                            │
│                                                                        │
│  NOTE: This file duplicates UserRank and RANK_HIERARCHY from           │
│  /src/rank/types.ts. This is intentional for Convex isolation -        │
│  Convex cannot import from src/. The canonical source is /src/rank/    │
└────────────────────────────────────────────────────────────────────────┘ */

import { DatabaseReader } from "@/convex/_generated/server";
import { Id } from "@/convex/_generated/dataModel";

export type UserRank = "crew" | "captain" | "commodore" | "admiral";

// Rank hierarchy for comparison
const RANK_HIERARCHY: Record<UserRank, number> = {
  crew: 0,
  captain: 1,
  commodore: 2,
  admiral: 3
};

/**
 * Verify user has Admiral rank for Fleet Control operations
 * 🛡️ SID-5.3: Accepts sovereign userId
 */
export async function requireAdmiralRank(ctx: { db: DatabaseReader }, userId: Id<"admin_users">) {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.rank || user.rank !== "admiral") {
    throw new Error("Unauthorized: Admiral rank required for Fleet Control");
  }

  return user;
}

/**
 * Verify user has minimum required rank
 * 🛡️ SID-5.3: Accepts sovereign userId
 */
export async function requireMinimumRank(
  ctx: { db: DatabaseReader },
  userId: Id<"admin_users">,
  minimumRank: UserRank
) {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.rank) {
    throw new Error("User rank not assigned");
  }

  const userRankLevel = RANK_HIERARCHY[user.rank as UserRank];
  const requiredRankLevel = RANK_HIERARCHY[minimumRank];

  if (userRankLevel < requiredRankLevel) {
    throw new Error(`Unauthorized: ${minimumRank} rank or higher required`);
  }

  return user;
}

/**
 * Check if user has Admiral rank (returns boolean)
 * 🛡️ SID-5.3: Accepts sovereign userId
 */
export async function isAdmiral(ctx: { db: DatabaseReader }, userId: Id<"admin_users">): Promise<boolean> {
  try {
    await requireAdmiralRank(ctx, userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get user rank safely
 * 🛡️ SID-5.3: Accepts sovereign userId
 */
export async function getUserRank(ctx: { db: DatabaseReader }, userId: Id<"admin_users">): Promise<UserRank | null> {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const user = await ctx.db.get(userId);

  return (user?.rank as UserRank) || null;
}

/**
 * Get all admin_users with specific rank
 */
export async function getUsersByRank(ctx: { db: DatabaseReader }, rank: UserRank) {
  return await ctx.db
    .query("admin_users")
    .withIndex("by_rank", (q) => q.eq("rank", rank))
    .collect();
}
