/**─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ SETTINGS DOMAIN MUTATIONS - SRS Layer 3                               │
│  /convex/domains/settings/mutations.ts                                    │
│                                                                           │
│  🛡️ S.I.D. COMPLIANT - Phase 10                                           │
│  - All mutations accept callerUserId: v.id("admin_users")                 │
│  - No ctx.auth.getUserIdentity() usage                                    │
│                                                                           │
│  All-rank self-scoped mutations for user settings                         │
│  Users can only update their own settings (enforced by callerUserId)      │
└───────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import type { MutationCtx } from "@/convex/_generated/server";
import { v } from "convex/values";

// Helper to calculate genome completion percentage
function calculateGenomeCompletion(genome: Record<string, unknown>): number {
  const fields = [
    'jobTitle', 'department', 'seniority',
    'industry', 'companySize', 'companyWebsite',
    'transformationGoal', 'transformationStage', 'transformationType', 'timelineUrgency',
    'howDidYouHearAboutUs', 'teamSize', 'annualRevenue', 'successMetric'
  ];

  let filled = 0;
  for (const field of fields) {
    const value = genome[field];
    if (value !== undefined && value !== null && value !== '') {
      filled++;
    }
  }

  return Math.round((filled / fields.length) * 100);
}

/**
 * Update user profile settings (non-genome fields)
 * 🛡️ SID Phase 10: Accepts sovereign callerUserId
 */
export const updateUserSettings = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    // Identity fields (verified externally)
    email: v.optional(v.string()),
    // secondaryEmail accepts null to CLEAR the field (undefined = don't update)
    secondaryEmail: v.optional(v.union(v.string(), v.null())),
    // Profile fields
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { callerUserId, secondaryEmail, ...otherFields } = args;

    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(callerUserId);
    if (!user) throw new Error("User not found");

    // Build update object - null means CLEAR the field
    const updateFields: Record<string, unknown> = {
      ...otherFields,
      updatedAt: Date.now(),
    };

    // Handle secondaryEmail: null = clear, string = update, undefined = skip
    if (secondaryEmail === null) {
      updateFields.secondaryEmail = undefined; // Convex: undefined in patch = remove field
    } else if (secondaryEmail !== undefined) {
      updateFields.secondaryEmail = secondaryEmail;
    }

    await ctx.db.patch(user._id, updateFields);

    return { success: true };
  },
});

/**
 * Update theme preferences
 * 🛡️ SID Phase 10: Accepts sovereign callerUserId
 */
export const updateThemeSettings = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    themeDark: v.optional(v.boolean()),
  },
  handler: async (ctx: MutationCtx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.callerUserId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      themeDark: args.themeDark,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update Miror AI preferences
 * 🛡️ SID Phase 10: Accepts sovereign callerUserId
 */
export const updateMirorSettings = mutation({
  args: {
    callerUserId: v.id("admin_users"),
    mirorAvatarProfile: v.optional(v.union(
      v.literal("f-1"),
      v.literal("f-2"),
      v.literal("f-3"),
      v.literal("m-1"),
      v.literal("m-2"),
      v.literal("m-3"),
      v.literal("i-1"),
      v.literal("i-2"),
      v.literal("i-3")
    )),
    mirorEnchantmentEnabled: v.optional(v.boolean()),
    mirorEnchantmentTiming: v.optional(v.union(
      v.literal("subtle"),
      v.literal("magical"),
      v.literal("playful")
    )),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { callerUserId, ...updateFields } = args;

    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(callerUserId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      ...updateFields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update Professional Genome
 * 🛡️ SID Phase 10: Accepts sovereign userId (already compliant)
 */
export const updateGenome = mutation({
  args: {
    // 🛡️ SID-5.3: Accept sovereign userId, not clerkId
    userId: v.id("admin_users"),
    // Professional Identity
    jobTitle: v.optional(v.string()),
    department: v.optional(v.string()),
    seniority: v.optional(v.string()),
    // Company Context
    industry: v.optional(v.string()),
    companySize: v.optional(v.string()),
    companyWebsite: v.optional(v.string()),
    // Transformation Journey
    transformationGoal: v.optional(v.string()),
    transformationStage: v.optional(v.string()),
    transformationType: v.optional(v.string()),
    timelineUrgency: v.optional(v.string()),
    // Growth Intel
    howDidYouHearAboutUs: v.optional(v.string()),
    teamSize: v.optional(v.number()),
    annualRevenue: v.optional(v.string()),
    successMetric: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { userId, ...genomeFields } = args;

    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    // Check if genome record exists
    const existingGenome = await ctx.db
      .query("settings_account_Genome")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();

    if (existingGenome) {
      // Update existing genome
      const updates = { ...genomeFields, updatedAt: now };
      const completionPercent = calculateGenomeCompletion({ ...existingGenome, ...genomeFields });

      await ctx.db.patch(existingGenome._id, {
        ...updates,
        completionPercent,
      });
    } else {
      // Create new genome record
      const completionPercent = calculateGenomeCompletion(genomeFields);

      await ctx.db.insert("settings_account_Genome", {
        userId: userId,
        ...genomeFields,
        completionPercent,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * Reset Professional Genome
 * 🛡️ SID Phase 10: Accepts sovereign callerUserId
 */
export const resetGenome = mutation({
  args: {
    callerUserId: v.id("admin_users"),
  },
  handler: async (ctx: MutationCtx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.callerUserId);
    if (!user) throw new Error("User not found");

    // Check if genome record exists
    const existingGenome = await ctx.db
      .query("settings_account_Genome")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingGenome) {
      await ctx.db.patch(existingGenome._id, {
        // Professional Identity
        jobTitle: undefined,
        department: undefined,
        seniority: undefined,
        // Company Context
        industry: undefined,
        companySize: undefined,
        companyWebsite: undefined,
        // Transformation Journey
        transformationGoal: undefined,
        transformationStage: undefined,
        transformationType: undefined,
        timelineUrgency: undefined,
        // Growth Intel
        howDidYouHearAboutUs: undefined,
        teamSize: undefined,
        annualRevenue: undefined,
        successMetric: undefined,
        // Meta
        completionPercent: 0,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});
