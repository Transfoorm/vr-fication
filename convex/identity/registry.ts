/**
 * 🛡️ SOVEREIGN IDENTITY REGISTRY
 *
 * S.I.D. Phase 14 - The ONLY place for Clerk → Convex correlation.
 *
 * This module provides functions to:
 * - Register new Clerk → Convex mappings (at user creation)
 * - Look up Convex userId from Clerk externalId
 * - Look up Clerk externalId from Convex userId (for VANISH only)
 *
 * RULES:
 * - Webhooks MUST use this registry for correlation
 * - Auth handoff MUST register mappings here
 * - Domain tables MUST NOT have by_clerk_id indexes
 * - VANISH quarantine may use reverse lookup
 *
 * See: _clerk-virus/S.I.D.—SOVEREIGN-IDENTITY-DOCTRINE.md (SID-14)
 */

import { DatabaseReader, DatabaseWriter } from "@/convex/_generated/server";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Register a new Clerk → Convex identity mapping.
 * Called during user creation (identity handoff ceremony).
 */
export async function registerClerkIdentity(
  db: DatabaseWriter,
  externalId: string,
  userId: Id<"admin_users">
): Promise<Id<"admin_users_ClerkRegistry">> {
  // Check for existing mapping (idempotent)
  const existing = await db
    .query("admin_users_ClerkRegistry")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .first();

  if (existing) {
    // Already registered - return existing ID
    return existing._id;
  }

  return await db.insert("admin_users_ClerkRegistry", {
    externalId,
    userId,
    provider: "clerk",
    createdAt: Date.now(),
  });
}

/**
 * Look up Convex userId from Clerk externalId.
 * Used by webhooks and auth boundary.
 */
export async function getUserIdFromClerkId(
  db: DatabaseReader,
  clerkId: string
): Promise<Id<"admin_users"> | null> {
  const mapping = await db
    .query("admin_users_ClerkRegistry")
    .withIndex("by_external_id", (q) => q.eq("externalId", clerkId))
    .first();

  return mapping?.userId ?? null;
}

/**
 * Look up Clerk externalId from Convex userId.
 * ⚠️ VANISH QUARANTINE ONLY - Do not use in domain logic.
 */
export async function getClerkIdFromUserId(
  db: DatabaseReader,
  userId: Id<"admin_users">
): Promise<string | null> {
  const mapping = await db
    .query("admin_users_ClerkRegistry")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .first();

  return mapping?.externalId ?? null;
}

/**
 * Delete a Clerk → Convex identity mapping.
 * Called during VANISH cascade (user deletion).
 */
export async function deleteClerkIdentity(
  db: DatabaseWriter,
  userId: Id<"admin_users">
): Promise<boolean> {
  const mapping = await db
    .query("admin_users_ClerkRegistry")
    .withIndex("by_user_id", (q) => q.eq("userId", userId))
    .first();

  if (mapping) {
    await db.delete(mapping._id);
    return true;
  }

  return false;
}
