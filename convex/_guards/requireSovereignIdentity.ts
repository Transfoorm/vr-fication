/**──────────────────────────────────────────────────────────────────────┐
│  🔱 SOVEREIGN IDENTITY GUARD - Convex Layer Protection                │
│  /convex/_guards/requireSovereignIdentity.ts                          │
│                                                                        │
│  Validates that callerClerkId was passed from Server Action           │
│  (via FUSE session cookie), NOT injected via ctx.auth token.          │
│                                                                        │
│  THE LAW:                                                              │
│    Server Actions read identity from FUSE session cookie.             │
│    Identity is passed to Convex as callerClerkId argument.            │
│    Convex validates the caller by looking up the user record.         │
│    ctx.auth.getUserIdentity() is FORBIDDEN for domain mutations.      │
│                                                                        │
│  Usage in Convex mutations:                                           │
│    import { requireSovereignIdentity } from './_guards/requireSovereignIdentity';  │
│                                                                        │
│    export const myMutation = mutation({                               │
│      args: {                                                          │
│        callerClerkId: v.string(),  // 🔱 SOVEREIGN                    │
│        ...otherArgs                                                   │
│      },                                                               │
│      handler: async (ctx, args) => {                                  │
│        const caller = await requireSovereignIdentity(ctx, args.callerClerkId);  │
│        // caller is now the validated user record                     │
│      },                                                               │
│    });                                                                │
│                                                                        │
│  Ref: Clerk Knox, Golden Bridge Pattern                               │
└────────────────────────────────────────────────────────────────────────┘ */

import { QueryCtx, MutationCtx } from "@/convex/_generated/server";
import { Doc } from "@/convex/_generated/dataModel";
import { getUserIdFromClerkId } from "@/convex/identity/registry";

/**
 * Validates sovereign identity from FUSE session cookie
 * 🛡️ S.I.D. Phase 14: Uses identity registry for Clerk→Convex lookup
 *
 * @param ctx - Convex context (query or mutation)
 * @param callerClerkId - ClerkId passed from Server Action (via session cookie)
 * @returns The validated user record
 * @throws Error if identity is missing or user not found
 */
export async function requireSovereignIdentity(
  ctx: QueryCtx | MutationCtx,
  callerClerkId: string | undefined | null
): Promise<Doc<"admin_users">> {
  // Validate callerClerkId was provided
  if (!callerClerkId) {
    throw new Error(
      "[SOVEREIGN GUARD] No callerClerkId provided. " +
      "Server Actions must pass identity from FUSE session cookie."
    );
  }

  // 🛡️ S.I.D. Phase 14: Look up via identity registry (not domain table index)
  const userId = await getUserIdFromClerkId(ctx.db, callerClerkId);

  if (!userId) {
    throw new Error(
      `[SOVEREIGN GUARD] User not found for clerkId: ${callerClerkId}. ` +
      "User may have been deleted or clerkId is invalid."
    );
  }

  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error(
      `[SOVEREIGN GUARD] User document missing for userId: ${userId}. ` +
      "Registry mapping exists but user record is gone."
    );
  }

  return user;
}

/**
 * Validates sovereign identity AND requires Admiral rank
 *
 * @param ctx - Convex context (query or mutation)
 * @param callerClerkId - ClerkId passed from Server Action (via session cookie)
 * @returns The validated Admiral user record
 * @throws Error if identity is missing, user not found, or not Admiral
 */
export async function requireAdmiral(
  ctx: QueryCtx | MutationCtx,
  callerClerkId: string | undefined | null
): Promise<Doc<"admin_users">> {
  const user = await requireSovereignIdentity(ctx, callerClerkId);

  if (user.rank !== "admiral") {
    throw new Error(
      `[SOVEREIGN GUARD] Admiral rank required. Current rank: ${user.rank || 'none'}`
    );
  }

  return user;
}

/**
 * Validates sovereign identity AND requires Commodore or higher rank
 *
 * @param ctx - Convex context (query or mutation)
 * @param callerClerkId - ClerkId passed from Server Action (via session cookie)
 * @returns The validated user record (Commodore or higher)
 * @throws Error if identity is missing, user not found, or insufficient rank
 */
export async function requireCommodoreOrHigher(
  ctx: QueryCtx | MutationCtx,
  callerClerkId: string | undefined | null
): Promise<Doc<"admin_users">> {
  const user = await requireSovereignIdentity(ctx, callerClerkId);

  const allowedRanks = ["admiral", "commodore"];
  if (!allowedRanks.includes(user.rank || "")) {
    throw new Error(
      `[SOVEREIGN GUARD] Commodore or higher rank required. Current rank: ${user.rank || 'none'}`
    );
  }

  return user;
}

/**
 * Validates sovereign identity AND requires Captain or higher rank
 *
 * @param ctx - Convex context (query or mutation)
 * @param callerClerkId - ClerkId passed from Server Action (via session cookie)
 * @returns The validated user record (Captain or higher)
 * @throws Error if identity is missing, user not found, or insufficient rank
 */
export async function requireCaptainOrHigher(
  ctx: QueryCtx | MutationCtx,
  callerClerkId: string | undefined | null
): Promise<Doc<"admin_users">> {
  const user = await requireSovereignIdentity(ctx, callerClerkId);

  const allowedRanks = ["admiral", "commodore", "captain"];
  if (!allowedRanks.includes(user.rank || "")) {
    throw new Error(
      `[SOVEREIGN GUARD] Captain or higher rank required. Current rank: ${user.rank || 'none'}`
    );
  }

  return user;
}
