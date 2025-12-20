/**──────────────────────────────────────────────────────────────────────┐
│  ✏️ UPDATE PROFILE - User Profile Mutation                             │
│  /convex/identity/updateProfile.ts                                     │
│                                                                        │
│  🛡️ SID-5.3 COMPLIANT: Accepts userId: v.id("admin_users")            │
│  Sovereign identity lookup via ctx.db.get()                            │
└────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const updateProfile = mutation({
  args: {
    // 🛡️ SID-5.3: Accept sovereign userId, not clerkId
    userId: v.id("admin_users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    entityName: v.optional(v.string()),
    socialName: v.optional(v.string()),
    businessCountry: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Validate entityName length
    if (args.entityName && args.entityName.length > 50) {
      throw new Error("Entity name must be 50 characters or less");
    }

    // Update user profile
    await ctx.db.patch(user._id, {
      firstName: args.firstName,
      lastName: args.lastName,
      entityName: args.entityName,
      socialName: args.socialName,
      businessCountry: args.businessCountry,
      updatedAt: Date.now(),
    });

    // Return updated user
    return await ctx.db.get(user._id);
  },
});
