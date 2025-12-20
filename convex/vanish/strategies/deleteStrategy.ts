/**─────────────────────────────────────────────────────────────────────────┐
│  🗑️ VANISH PROTOCOL 2.0 - DELETE STRATEGY                                 │
│  /convex/vanish/strategies/deleteStrategy.ts                              │
│                                                                           │
│  Permanently removes documents from the database.                         │
│  Used for user-owned data that should not persist after deletion.         │
│                                                                           │
│  Examples:                                                                │
│  - Projects owned by user (ownerId)                                       │
│  - User's private notes                                                   │
│  - User's notifications                                                   │
│  - User's personal invoices                                               │
└───────────────────────────────────────────────────────────────────────────┘ */

import { DatabaseWriter } from "@/convex/_generated/server";
import type { Id, TableNames } from "@/convex/_generated/dataModel";

// Type for a document with at least an _id field from any table
type DocumentWithId = {
  _id: Id<TableNames>;
};

/**
 * DELETE STRATEGY
 *
 * Permanently removes a document from the database.
 *
 * @param db - Convex database writer
 * @param doc - Document to delete
 * @returns void
 *
 * IDEMPOTENCY: Safe to call multiple times - no-op if already deleted
 * PERFORMANCE: O(1) delete operation
 */
export async function executeDeleteStrategy(
  db: DatabaseWriter,
  doc: DocumentWithId
): Promise<void> {
  try {
    await db.delete(doc._id);
  } catch (error) {
    // Document may already be deleted - this is fine in fail-resume scenarios
    if (error instanceof Error && error.message.includes('does not exist')) {
      // Silently ignore - idempotent behavior
      return;
    }
    throw error;
  }
}

/**
 * BATCH DELETE
 *
 * Deletes multiple documents in a single operation.
 * More efficient than individual deletes for large batches.
 *
 * @param db - Convex database writer
 * @param docs - Array of documents to delete
 * @returns Number of documents deleted
 */
export async function executeBatchDelete(
  db: DatabaseWriter,
  docs: DocumentWithId[]
): Promise<number> {
  let deletedCount = 0;

  for (const doc of docs) {
    try {
      await db.delete(doc._id);
      deletedCount++;
    } catch (error) {
      // Continue on errors for fail-resume
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.error(`Failed to delete doc ${doc._id}:`, error.message);
      }
    }
  }

  return deletedCount;
}
