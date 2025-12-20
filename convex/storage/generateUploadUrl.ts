/**──────────────────────────────────────────────────────────────────────┐
│  📦 STORAGE - Generate Upload URL                                      │
│  /convex/storage/generateUploadUrl.ts                                  │
│                                                                        │
│  🛡️ SID-5.3 COMPLIANT: Accepts userId: v.id("admin_users")            │
│  Sovereign identity lookup via ctx.db.get()                            │
└────────────────────────────────────────────────────────────────────────┘ */

import { mutation } from "@/convex/_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {
    // 🛡️ SID-5.3: Accept sovereign userId, not clerkId
    userId: v.id("admin_users"),
  },
  handler: async (ctx, args) => {
    // 🛡️ SID-5.3: Direct lookup by sovereign _id
    const user = await ctx.db.get(args.userId);

    if (!user) {
      throw new Error("User not found");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();
    return uploadUrl;
  },
});
