/**─────────────────────────────────────────────────────────────────────────┐
│  🔄 VANISH PROTOCOL 2.0 - REASSIGN STRATEGY                               │
│  /convex/vanish/strategies/reassignStrategy.ts                            │
│                                                                           │
│  Transfers ownership from deleted user to another user.                   │
│  Used for organizational assets that must have an active owner.           │
│                                                                           │
│  Examples:                                                                │
│  - Organizations where Captain is deleted → transfer to new Captain       │
│  - Projects being reassigned to team lead                                 │
│  - Client accounts being reassigned to another consultant                 │
│                                                                           │
│  POLICY: Reassignment requires either:                                    │
│  - Explicit user choice (select new owner before deletion)                │
│  - Organizational policy (default reassignment rules)                     │
│  - Admiral intervention (manual reassignment)                             │
└───────────────────────────────────────────────────────────────────────────┘ */

import { DatabaseWriter } from "@/convex/_generated/server";
import type { Id, TableNames } from "@/convex/_generated/dataModel";

// Type for a document with at least an _id field and other properties
type DocumentWithId = {
  _id: Id<TableNames>;
  [key: string]: unknown;
};

/**
 * REASSIGN STRATEGY
 *
 * Transfers ownership from deleted user to another user.
 * Preserves document but changes ownership reference.
 *
 * @param db - Convex database writer
 * @param doc - Document to reassign
 * @param fieldName - Name of the user reference field to reassign
 * @param newOwnerId - ID of the new owner (must be provided)
 * @returns void
 *
 * IDEMPOTENCY: Safe to call multiple times with same newOwnerId
 * PRESERVATION: Document structure preserved, only ownership changes
 *
 * @throws Error if newOwnerId is not provided
 */
export async function executeReassignStrategy(
  db: DatabaseWriter,
  doc: DocumentWithId,
  fieldName: string,
  newOwnerId?: Id<"admin_users">
): Promise<void> {
  if (!newOwnerId) {
    throw new Error(
      `[VANISH PROTOCOL] Reassign strategy requires newOwnerId for field ${fieldName}`
    );
  }

  // Check if already reassigned to this owner
  if (doc[fieldName] === newOwnerId) {
    return; // Already reassigned - idempotent
  }

  // Build patch object
  const patch: Record<string, unknown> = {
    [fieldName]: newOwnerId,
    reassignedAt: Date.now(),
    reassignedReason: 'Previous owner deleted',
    previousOwner: doc[fieldName], // Preserve audit trail
  };

  try {
    await db.patch(doc._id, patch);
  } catch (error) {
    // Document may have been deleted - this is fine
    if (error instanceof Error && error.message.includes('does not exist')) {
      return; // Idempotent behavior
    }
    throw error;
  }
}

/**
 * BATCH REASSIGN
 *
 * Reassigns multiple documents to a new owner.
 *
 * @param db - Convex database writer
 * @param docs - Array of documents to reassign
 * @param fieldName - Name of the user reference field to reassign
 * @param newOwnerId - ID of the new owner
 * @returns Number of documents reassigned
 */
export async function executeBatchReassign(
  db: DatabaseWriter,
  docs: DocumentWithId[],
  fieldName: string,
  newOwnerId?: Id<"admin_users">
): Promise<number> {
  if (!newOwnerId) {
    throw new Error(
      `[VANISH PROTOCOL] Batch reassign requires newOwnerId for field ${fieldName}`
    );
  }

  let reassignedCount = 0;

  for (const doc of docs) {
    try {
      await executeReassignStrategy(db, doc, fieldName, newOwnerId);
      reassignedCount++;
    } catch (error) {
      // Continue on errors for fail-resume
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.error(`Failed to reassign doc ${doc._id}:`, error.message);
      }
    }
  }

  return reassignedCount;
}

/**
 * RESOLVE REASSIGNMENT POLICY
 *
 * Helper to determine who should be the new owner based on organizational policy.
 * This is a placeholder - implement your specific business logic.
 *
 * @param db - Convex database reader
 * @param doc - Document being reassigned
 * @param deletedUserId - ID of user being deleted
 * @returns ID of new owner, or null if no policy applies
 *
 * EXAMPLES:
 * - For organizations: Find next most senior member
 * - For projects: Find team lead or project manager
 * - For client accounts: Find account manager or supervisor
 */
export async function resolveReassignmentPolicy(): Promise<Id<"admin_users"> | null> {
  // TODO: Implement organizational reassignment policies
  // This is intentionally a placeholder for business logic

  // Example policies:
  //
  // 1. Organization Captain deletion → Find new Captain from crew
  // if (doc._id.table === 'organizations') {
  //   // Find most senior crew member
  //   const crew = await db.query('organizationMembers')
  //     .withIndex('by_org', q => q.eq('orgId', doc._id))
  //     .filter(q => q.neq(q.field('userId'), deletedUserId))
  //     .order('desc')
  //     .first();
  //   return crew?.userId ?? null;
  // }
  //
  // 2. Project ownership → Reassign to org Captain
  // if (doc._id.table === 'projects' && doc.orgId) {
  //   const org = await db.get(doc.orgId);
  //   return org?.captainId ?? null;
  // }

  return null; // No policy - caller must provide explicit newOwnerId
}
