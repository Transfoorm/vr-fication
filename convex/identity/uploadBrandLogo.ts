/**──────────────────────────────────────────────────────────────────────┐
│  🏷️ UPLOAD BRAND LOGO - Company Logo Storage                          │
│  /convex/identity/uploadBrandLogo.ts                                   │
│                                                                        │
│  🛡️ SID-5.3 COMPLIANT: Accepts userId: v.id("admin_users")            │
│  Sovereign identity lookup via ctx.db.get()                            │
└────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";
import { Id } from "@/convex/_generated/dataModel";

export const uploadBrandLogo = mutation({
  args: {
    fileId: v.id("_storage"),
    // 🛡️ SID-5.3: Accept sovereign userId, not clerkId
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    const { fileId, userId } = args;

    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Store the old logo before updating
    const oldBrandLogo = user.brandLogoUrl;

    // Store the storage ID (client will convert to URL)
    await ctx.db.patch(user._id, {
      brandLogoUrl: fileId,
      updatedAt: Date.now(),
    });
    console.log(`✅ Brand logo uploaded: Storage ID ${fileId} saved to user ${userId}`);

    // Delete the old brand logo from storage if it exists and it's a storage ID
    if (oldBrandLogo && typeof oldBrandLogo === 'string') {
      // Check if it's a Convex storage ID (not an HTTP URL)
      if (!oldBrandLogo.startsWith('http')) {
        try {
          await ctx.storage.delete(oldBrandLogo as Id<"_storage">);
          console.log(`🗑️ Deleted old brand logo from storage: ${oldBrandLogo}`);
        } catch (error) {
          console.error("❌ Failed to delete old brand logo:", error);
        }
      } else {
        console.log(`⏭️ Skipped deletion - old brand logo is URL: ${oldBrandLogo.substring(0, 50)}...`);
      }
    }

    return { storageId: fileId };
  },
});
