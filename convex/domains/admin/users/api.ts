// FUSE Users API - Domain Wrapper Layer
// 🛡️ S.I.D. Phase 14: Uses admin_users_ClerkRegistry for Clerk correlation
import { query, mutation } from "@/convex/_generated/server";
import type { QueryCtx, MutationCtx } from "@/convex/_generated/server";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { v } from "convex/values";
import { UsersModel } from "./model";
import { isTrialExpired, isInGracePeriod } from "@/fuse/constants/ranks";
import { getUserIdFromClerkId } from "@/convex/identity/registry";

// ══════════════════════════════════════════════════════════════════════
// AUTHORIZATION HELPER
// ══════════════════════════════════════════════════════════════════════

/**
 * 🛡️ SID Phase 10: Sovereign Admiral Guard
 * Validates caller has Admiral rank using sovereign userId
 *
 * @param ctx - Convex context
 * @param callerUserId - Sovereign user ID from FUSE session
 * @returns The validated Admiral user record
 * @throws Error if user not found or not Admiral
 */
async function requireAdmiral(ctx: QueryCtx | MutationCtx, callerUserId: Id<"admin_users">) {
  // 🛡️ SID-5.3: Direct lookup by sovereign _id
  const currentUser = await ctx.db.get(callerUserId);

  if (!currentUser) {
    console.error('❌ requireAdmiral: User not found for userId:', callerUserId);
    throw new Error("User not found");
  }

  // Check rank (case-insensitive)
  if (currentUser.rank?.toLowerCase() !== "admiral") {
    console.error(`❌ requireAdmiral: User ${currentUser.email} has rank "${currentUser.rank}", needs "admiral"`);
    throw new Error("Unauthorized: Admiral rank required");
  }

  console.log(`✅ requireAdmiral: User ${currentUser.email} authorized as Admiral`);
  return currentUser;
}

// QUERIES

// 🛡️ SID Phase 2: Sovereign Identity Mutation
// TTT-CERTIFIED: Update lastLoginAt, increment loginCount, and check trial expiration on every login
export const updateLastLogin = mutation({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    const updates: Partial<typeof user> = {
      lastLoginAt: now,
      loginCount: (user.loginCount || 0) + 1,
      updatedAt: now,
    };

    // RANK-AWARE SYSTEM: Check trial expiration (TTT-compliant, login-check only)
    // Only check if user is on trial or has expired status
    if (user.subscriptionStatus === "trial" || user.subscriptionStatus === "expired") {
      const expired = isTrialExpired(user.trialEndsAt);
      const inGrace = isInGracePeriod(user.trialEndsAt);

      if (expired && !inGrace) {
        // Trial expired and grace period ended → Demote to Crew
        updates.rank = "crew";
        updates.subscriptionStatus = "expired";
      } else if (expired && inGrace) {
        // In grace period → Keep Captain but mark as expired
        updates.subscriptionStatus = "expired";
      }
      // If not expired, keep current status (trial continues)
    }

    // Lifetime and active subscriptions never expire, skip checks

    await ctx.db.patch(args.userId, updates);

    return {
      success: true,
      trialExpired: updates.subscriptionStatus === "expired",
      demotedToCrew: updates.rank === "crew",
    };
  },
});

// 🛡️ SID Phase 10: Sovereign query - accepts callerUserId
export const getAllUsers = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🔒 SECURITY: Admiral-only access (return empty if unauthorized)
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return []; // Return empty array instead of throwing
    }

    // Get all admin_users from database (ordered by _creationTime DESC - latest first)
    const admin_users = await ctx.db.query("admin_users").order("desc").collect();
    console.log(`✅ getAllUsers: Returning ${admin_users.length} admin_users (sorted by _creationTime DESC - v2)`);

    // Resolve storage URLs for avatars and logos (in parallel for performance)
    const usersWithUrls = await Promise.all(
      admin_users.map(async (user) => {
        // Resolve avatarUrl
        let avatarUrl = null;
        if (user.avatarUrl) {
          try {
            const url = await ctx.storage.getUrl(user.avatarUrl);
            avatarUrl = url;
          } catch {
            // Fallback to direct URL string if it's an HTTP URL
            if (typeof user.avatarUrl === 'string' && user.avatarUrl.startsWith('http')) {
              avatarUrl = user.avatarUrl;
            }
          }
        }

        // Resolve brandLogoUrl
        let brandLogoUrl = null;
        if (user.brandLogoUrl) {
          try {
            const url = await ctx.storage.getUrl(user.brandLogoUrl);
            brandLogoUrl = url;
          } catch {
            // Fallback to direct URL string if it's an HTTP URL
            if (typeof user.brandLogoUrl === 'string' && user.brandLogoUrl.startsWith('http')) {
              brandLogoUrl = user.brandLogoUrl;
            }
          }
        }

        return {
          _id: user._id,
          // clerkId removed per SID-15.3
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          entityName: user.entityName,
          socialName: user.socialName,
          phoneNumber: user.phoneNumber,
          businessCountry: user.businessCountry,
          rank: user.rank,
          setupStatus: user.setupStatus,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          loginCount: user.loginCount || 0,
          avatarUrl, // Resolved URL
          brandLogoUrl, // Resolved URL
        };
      })
    );

    // Return with basic info (no sensitive data)
    // 🛡️ S.I.D. Phase 15: clerkId removed from domain query returns
    return usersWithUrls;
  },
});

// 🛡️ SID Phase 10: Sovereign query - accepts callerUserId
// Get paginated admin_users (Admiral-only, for large-scale user management)
export const getAllUsersPaginated = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🔒 SECURITY: Admiral-only access (return empty if unauthorized)
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return []; // Return empty array instead of throwing
    }

    // Query all admin_users with descending order
    const admin_users = await ctx.db.query("admin_users").order("desc").collect();

    // Return with basic info (no sensitive data)
    // 🛡️ S.I.D. Phase 15: clerkId removed from domain query returns
    return admin_users.map((user) => ({
      _id: user._id,
      // clerkId removed per SID-15.3
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      entityName: user.entityName,
      socialName: user.socialName,
      phoneNumber: user.phoneNumber,
      rank: user.rank,
      setupStatus: user.setupStatus,
      createdAt: user.createdAt,
    }));
  },
});

// 🛡️ SID Phase 10: Sovereign query - accepts callerUserId
// Get user by Convex ID for editing (Admiral-only, TTT-compliant)
export const getUserForEdit = query({
  args: { callerUserId: v.id("admin_users"), userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🔒 SECURITY: Admiral-only access (return null if unauthorized)
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return null; // Return null instead of throwing
    }

    // Direct document fetch - TTT-passing performance
    const user = await ctx.db.get(args.userId);

    if (!user) return null;

    // Resolve storage URL for avatar
    const avatarField = user.avatarUrl;
    let avatarUrl = null;

    if (avatarField) {
      try {
        // Try to resolve as storage ID
        const url = await ctx.storage.getUrl(avatarField);
        avatarUrl = url;
      } catch {
        // Fallback to direct URL string if it's an HTTP URL
        if (typeof avatarField === 'string' && avatarField.startsWith('http')) {
          avatarUrl = avatarField;
        }
      }
    }

    // Return complete user document with resolved avatar URL
    return {
      ...user,
      avatarUrl, // Override with resolved URL
    };
  },
});

// ⚡ FUSE 6.0: Lightweight query for session minting (skips expensive storage URL resolution)
// 🛡️ SID Phase 2: Now accepts userId instead of clerkId
// Used during login critical path where storage URLs aren't needed yet (only raw data for JWT)
export const getCurrentUserForSession = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const start = Date.now();
    console.log(`⚡ getCurrentUserForSession: START for userId=${args.userId}`);

    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);

    console.log(`⚡ getCurrentUserForSession: DONE in ${Date.now() - start}ms`);
    return user;
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Query
export const getCurrentUser = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);

    if (!user) return null;

    // Resolve storage URL for avatar
    const avatarField = user.avatarUrl;
    let avatarUrl = null;

    if (avatarField) {
      // Check if it's already an HTTP URL (from a previous successful conversion)
      if (typeof avatarField === 'string' && avatarField.startsWith('http')) {
        avatarUrl = avatarField;
      } else {
        // It's a storage ID - try to resolve it
        try {
          const url = await ctx.storage.getUrl(avatarField);
          if (url) {
            // Successfully got URL from storage
            avatarUrl = url;
            console.log('✅ Avatar URL resolved:', url.substring(0, 60));
          } else {
            // Storage.getUrl returned null - this can happen if the file was just uploaded
            // and isn't fully committed yet. For now, return null and let client use fallback
            console.error('❌ Avatar URL is null for storage ID:', avatarField);
            avatarUrl = null;
          }
        } catch (error) {
          console.error('❌ Error resolving avatar storage ID:', error);
          avatarUrl = null;
        }
      }
    }

    // Resolve storage URL for brand logo
    let brandLogoUrl = null;

    if (user.brandLogoUrl) {
      // Check if it's already an HTTP URL (from a previous successful conversion)
      if (typeof user.brandLogoUrl === 'string' && user.brandLogoUrl.startsWith('http')) {
        brandLogoUrl = user.brandLogoUrl;
      } else {
        // It's a storage ID - try to resolve it
        try {
          const url = await ctx.storage.getUrl(user.brandLogoUrl);
          if (url) {
            // Successfully got URL from storage
            brandLogoUrl = url;
            console.log('✅ Brand logo URL resolved:', url.substring(0, 60));
          } else {
            // Storage.getUrl returned null - this can happen if the file was just uploaded
            // and isn't fully committed yet. For now, return null and let client use fallback
            console.error('❌ Brand logo URL is null for storage ID:', user.brandLogoUrl);
            brandLogoUrl = null;
          }
        } catch (error) {
          console.error('❌ Error resolving brand logo storage ID:', error);
          brandLogoUrl = null;
        }
      }
    }

    return {
      ...user,
      avatarUrl,
      brandLogoUrl
    };
  },
});

// 🛡️ SID Phase 10: Sovereign query - accepts callerUserId
// Get RAW user document for Database tab with ALL schema fields (Admiral-only, TTT-compliant)
export const getRawUserDocument = query({
  args: { callerUserId: v.id("admin_users"), userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Sovereign Admiral check
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return null;
    }

    // Direct document fetch - TTT-passing performance
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    // Return the raw user object - Convex already includes all schema fields
    // Missing fields will be undefined (shown as null in JSON)
    return {
      ...user,
      _id: user._id.toString() // Convert ID to string for display
    };
  },
});

// 🛡️ SID Phase 2: DEPRECATED - Use getUserById instead
// Kept for backwards compatibility during migration only
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    console.warn('⚠️ DEPRECATED: getUserByClerkId called - use getUserById instead');
    const user = await UsersModel.getUserByClerkId(ctx.db, args.clerkId);

    if (!user) return null;

    // Resolve storage URL for avatar
    const avatarField = user.avatarUrl;
    let avatarUrl = null;

    if (avatarField) {
      try {
        const url = await ctx.storage.getUrl(avatarField);
        avatarUrl = url;
      } catch {
        if (typeof avatarField === 'string' && avatarField.startsWith('http')) {
          avatarUrl = avatarField;
        }
      }
    }

    return {
      ...user,
      avatarUrl
    };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Query
export const getUserThemePreferences = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return { themeDark: user.themeDark };
  },
});

// ══════════════════════════════════════════════════════════════════════
// 🛡️ S.I.D. PHASE 0 — SOVEREIGN IDENTITY MUTATIONS
// These mutations are the ONLY place where clerkId is accepted
// Called ONLY during Identity Handoff Ceremony
// REF: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md
// ══════════════════════════════════════════════════════════════════════

/**
 * 🛡️ ensureUser — Identity Handoff Ceremony Mutation
 *
 * The ONE mutation that accepts clerkId and returns sovereign _id.
 * Called ONLY from /app/(auth)/actions/identity-handoff.ts
 *
 * SID Rules Enforced:
 * - SID-1.2: Clerk identity not used before Convex _id exists
 * - SID-1.3: Session minting will NOT produce empty _id (we guarantee it)
 * - SID-1.6: No session minted without valid Convex _id
 * - SID-5.4: After this point, NO mutation looks up by clerkId
 */
export const ensureUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Doc<"admin_users"> | null> => {
    const start = Date.now();
    console.log(`🛡️ SID ensureUser: START for clerkId=${args.clerkId}`);

    // 🛡️ S.I.D. Phase 14: Look up via identity registry (not domain table index)
    const existingUserId = await getUserIdFromClerkId(ctx.db, args.clerkId);

    if (existingUserId) {
      const existing = await ctx.db.get(existingUserId);
      if (existing) {
        // Update last login
        await ctx.db.patch(existing._id, {
          lastLoginAt: Date.now(),
          loginCount: (existing.loginCount || 0) + 1,
          updatedAt: Date.now(),
        });

        console.log(`🛡️ SID ensureUser: EXISTING user ${existing._id} in ${Date.now() - start}ms`);

        // Return the SOVEREIGN _id and user data
        return existing;
      }
    }

    // Create new user — Convex becomes source of truth
    // (UsersModel.createUser also registers in admin_users_ClerkRegistry)
    console.log(`🛡️ SID ensureUser: CREATING new user for ${args.email}`);
    const userIdString = await UsersModel.createUser(ctx.db, {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      avatarUrl: args.avatarUrl,
    });

    // Return the newly created user with SOVEREIGN _id
    const userId = userIdString as Id<"admin_users">;
    const newUser = await ctx.db.get(userId);

    console.log(`🛡️ SID ensureUser: NEW user ${userIdString} in ${Date.now() - start}ms`);

    return newUser;
  },
});

/**
 * 🛡️ getUserById — Sovereign Identity Query
 *
 * The CORRECT way to look up a user — by Convex _id, not clerkId.
 * Used by Server Actions after reading session._id from FUSE cookie.
 *
 * SID Rules Enforced:
 * - SID-5.3: Convex accepts only userId: v.id("admin_users")
 * - SID-9.4: Uses ctx.db.get(userId) for identity resolution
 */
export const getUserById = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const start = Date.now();
    console.log(`🛡️ SID getUserById: START for userId=${args.userId}`);

    // Direct document fetch — THE SOVEREIGN WAY
    const user = await ctx.db.get(args.userId);

    if (!user) {
      console.log(`🛡️ SID getUserById: NOT FOUND in ${Date.now() - start}ms`);
      return null;
    }

    // Resolve storage URLs
    let avatarUrl = null;
    if (user.avatarUrl) {
      try {
        const url = await ctx.storage.getUrl(user.avatarUrl);
        avatarUrl = url;
      } catch {
        if (typeof user.avatarUrl === 'string' && user.avatarUrl.startsWith('http')) {
          avatarUrl = user.avatarUrl;
        }
      }
    }

    let brandLogoUrl = null;
    if (user.brandLogoUrl) {
      try {
        const url = await ctx.storage.getUrl(user.brandLogoUrl);
        brandLogoUrl = url;
      } catch {
        if (typeof user.brandLogoUrl === 'string' && user.brandLogoUrl.startsWith('http')) {
          brandLogoUrl = user.brandLogoUrl;
        }
      }
    }

    console.log(`🛡️ SID getUserById: FOUND ${user.email} in ${Date.now() - start}ms`);

    return {
      ...user,
      avatarUrl,
      brandLogoUrl,
    };
  },
});

/**
 * 🛡️ getUserByIdForSession — Lightweight Sovereign Query
 *
 * Like getUserById but skips storage URL resolution for session reminting.
 * Used when we just need raw data for JWT, not for display.
 */
export const getUserByIdForSession = query({
  args: { userId: v.id("admin_users") },
  handler: async (ctx, args) => {
    const start = Date.now();
    console.log(`⚡ getUserByIdForSession: START for userId=${args.userId}`);

    // Direct document fetch — no storage URL resolution
    const user = await ctx.db.get(args.userId);

    console.log(`⚡ getUserByIdForSession: DONE in ${Date.now() - start}ms`);
    return user;
  },
});

// MUTATIONS
export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    setupStatus: v.optional(v.union(
      v.literal("invited"),
      v.literal("pending"),
      v.literal("abandon"),
      v.literal("complete"),
      v.literal("revoked")
    )),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await UsersModel.createUser(ctx.db, args);
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateThemePreferences = mutation({
  args: {
    userId: v.id("admin_users"),
    themeName: v.optional(v.literal("transtheme")),
    themeDark: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (args.themeDark !== undefined) {
      await ctx.db.patch(args.userId, {
        themeDark: args.themeDark,
        updatedAt: Date.now(),
      });
    }

    return { themeDark: args.themeDark ?? user.themeDark };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateMirorAvatarProfile = mutation({
  args: {
    userId: v.id("admin_users"),
    mirorAvatarProfile: v.union(
      v.literal("f-1"),
      v.literal("f-2"),
      v.literal("f-3"),
      v.literal("m-1"),
      v.literal("m-2"),
      v.literal("m-3"),
      v.literal("i-1"),
      v.literal("i-2"),
      v.literal("i-3")
    )
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      mirorAvatarProfile: args.mirorAvatarProfile,
      updatedAt: Date.now(),
    });

    return { success: true, mirorAvatarProfile: args.mirorAvatarProfile };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateMirorEnchantment = mutation({
  args: {
    userId: v.id("admin_users"),
    mirorEnchantmentEnabled: v.boolean()
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      mirorEnchantmentEnabled: args.mirorEnchantmentEnabled,
      updatedAt: Date.now(),
    });

    return { success: true, mirorEnchantmentEnabled: args.mirorEnchantmentEnabled };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateMirorEnchantmentTiming = mutation({
  args: {
    userId: v.id("admin_users"),
    mirorEnchantmentTiming: v.union(
      v.literal("subtle"),
      v.literal("magical"),
      v.literal("playful")
    )
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      mirorEnchantmentTiming: args.mirorEnchantmentTiming,
      updatedAt: Date.now(),
    });

    return { success: true, mirorEnchantmentTiming: args.mirorEnchantmentTiming };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateBusinessCountry = mutation({
  args: {
    userId: v.id("admin_users"),
    businessCountry: v.string(),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      businessCountry: args.businessCountry,
      updatedAt: Date.now(),
    });

    return user;
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const completeSetup = mutation({
  args: {
    userId: v.id("admin_users"),
    firstName: v.string(),
    lastName: v.string(),
    entityName: v.string(),
    socialName: v.string(),
    orgSlug: v.string(),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      firstName: args.firstName,
      lastName: args.lastName,
      entityName: args.entityName,
      socialName: args.socialName,
      orgSlug: args.orgSlug,
      businessCountry: args.businessCountry,
      setupStatus: "complete",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateProfile = mutation({
  args: {
    userId: v.id("admin_users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.entityName !== undefined) {
      updates.entityName = args.entityName;
      // Regenerate orgSlug when entity name changes
      updates.orgSlug = args.entityName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (args.socialName !== undefined) updates.socialName = args.socialName;
    if (args.phoneNumber !== undefined) updates.phoneNumber = args.phoneNumber;
    if (args.businessCountry !== undefined) updates.businessCountry = args.businessCountry;

    await ctx.db.patch(args.userId, updates);

    return { success: true };
  },
});

// 🛡️ SID Phase 2: Sovereign Identity Mutation
export const updateEntity = mutation({
  args: {
    userId: v.id("admin_users"),
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.entityName !== undefined) {
      updates.entityName = args.entityName;
      // Regenerate orgSlug when entity name changes
      updates.orgSlug = args.entityName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (args.socialName !== undefined) updates.socialName = args.socialName;
    if (args.businessCountry !== undefined) updates.businessCountry = args.businessCountry;

    await ctx.db.patch(args.userId, updates);

    return { success: true };
  },
});

// NOTE: Professional Genome mutations moved to /convex/domains/settings/mutations.ts
// Genome data now lives in settings_account_Genome table

// Webhook mutation to sync user data from Clerk
export const syncUserFromClerk = mutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    secondaryEmail: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await UsersModel.getUserByClerkId(ctx.db, args.clerkId);

    // Auto-create user if doesn't exist (fallback for webhook safety)
    if (!user) {
      console.log(`[syncUserFromClerk] User not found, auto-creating for clerkId=${args.clerkId}`);
      return await UsersModel.createUser(ctx.db, {
        clerkId: args.clerkId,
        email: args.email || '',
        firstName: args.firstName,
        lastName: args.lastName,
        avatarUrl: args.avatarUrl,
      });
    }

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (args.email !== undefined) updates.email = args.email;
    if (args.secondaryEmail !== undefined) updates.secondaryEmail = args.secondaryEmail;
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    await ctx.db.patch(user._id, updates);

    return { success: true };
  },
});

// ═══════════════════════════════════════════════════════════════════
// 🔥 VANISH PROTOCOL 2.1 - USER DELETION MUTATIONS & ACTIONS
// ═══════════════════════════════════════════════════════════════════

// Export deletion mutations from /convex/vanish/
export { deleteCurrentUser } from "@/convex/vanish/deleteCurrentUser";
export { deleteAnyUser } from "@/convex/vanish/deleteAnyUser";

// Export deletion actions (for HTTP operations like Clerk deletion)
export { deleteAnyUserWithClerk } from "@/convex/vanish/deleteAnyUserAction";

// Export audit log update mutation
export { updateClerkDeletionStatus } from "@/convex/vanish/updateClerkDeletionStatus";

// Export VANISH Journal management
export { deleteDeletionLog } from "@/convex/vanish/deleteDeletionLog";

// 🛡️ SID Phase 10: Sovereign query - accepts callerUserId
// Get all deletion logs (Admiral-only, for audit trail)
export const getAllDeletionLogs = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🔒 SECURITY: Admiral-only access (return empty if unauthorized)
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return []; // Return empty array instead of throwing
    }

    const logs = await ctx.db.query("admin_users_DeleteLog")
      .order("desc")
      .collect();
    return logs;
  },
});

// 🛡️ SID Phase 15: Get ClerkRegistry count for DB integrity check
// Returns count of ClerkRegistry records (should match user count 1:1)
export const getClerkRegistryCount = query({
  args: { callerUserId: v.id("admin_users") },
  handler: async (ctx, args) => {
    // 🔒 SECURITY: Admiral-only access (return 0 if unauthorized)
    try {
      await requireAdmiral(ctx, args.callerUserId);
    } catch {
      return 0; // Return 0 instead of throwing
    }

    // Count all ClerkRegistry records
    const registryRecords = await ctx.db.query("admin_users_ClerkRegistry").collect();
    return registryRecords.length;
  },
});

// ═══════════════════════════════════════════════════════════════════
// 🎖️ RANK-AWARE SYSTEM - SUBSCRIPTION & TRIAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

// Export subscription mutations (Admiral god-mode controls)
export {
  setUserTrial,
  extendUserTrial,
  setUserSubscription,
  grantLifetimeAccess,
  setUserRank,
  bulkSetSubscription,
} from "./mutations/subscription";

// Export subscription stats queries (Admiral dashboard)
export {
  getSubscriptionStats,
  getExpiringTrials,
  getRankDistribution,
} from "./queries/subscriptionStats";

// NOTE: uploadBrandLogo moved to /convex/identity/uploadBrandLogo.ts

