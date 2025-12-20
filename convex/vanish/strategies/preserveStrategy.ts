/**─────────────────────────────────────────────────────────────────────────┐
│  💾 VANISH PROTOCOL 2.0 - PRESERVE STRATEGY                               │
│  /convex/vanish/strategies/preserveStrategy.ts                            │
│                                                                           │
│  Explicitly preserves documents unchanged during user deletion.           │
│  Used for shared resources and data needed by other users.                │
│                                                                           │
│  Examples:                                                                │
│  - Messages where recipientId should be preserved for recipient           │
│  - Shared projects where collaboratorId should remain                     │
│  - Billing history for compliance (never delete financial records)        │
│  - Audit logs (immutable compliance requirement)                          │
│                                                                           │
│  NOTE: This strategy is a no-op by design, but makes intent explicit.     │
└───────────────────────────────────────────────────────────────────────────┘ */

import type { Id, TableNames } from "@/convex/_generated/dataModel";

// Type for a document with at least an _id field from any table
type DocumentWithId = {
  _id: Id<TableNames>;
};

/**
 * PRESERVE STRATEGY
 *
 * Explicitly marks a document as preserved during cascade deletion.
 * This is a no-op operation, but provides:
 * - Explicit documentation of preservation intent
 * - Audit trail of what was preserved
 * - Consistency with other strategies
 *
 * @param db - Convex database writer (unused, for interface consistency)
 * @param doc - Document to preserve
 * @param fieldName - Field being preserved (unused, for interface consistency)
 * @returns void
 *
 * IDEMPOTENCY: Always safe - no-op
 * PRESERVATION: Document remains completely unchanged
 */
export async function executePreserveStrategy(): Promise<void> {
  // Intentional no-op
  // Document is preserved as-is
  return;
}

/**
 * BATCH PRESERVE
 *
 * Preserves multiple documents (no-op for all).
 * Provided for consistency with other strategy interfaces.
 *
 * @param db - Convex database writer (unused)
 * @param docs - Array of documents to preserve
 * @param fieldName - Field being preserved (unused)
 * @returns Number of documents "preserved" (always = docs.length)
 */
export async function executeBatchPreserve(
  docs: DocumentWithId[]
): Promise<number> {
  // No-op - all documents preserved by default
  return docs.length;
}

/**
 * Helper: Log preservation for audit trail
 *
 * Can be called to explicitly document preservation decisions.
 * Useful for debugging and compliance audits.
 *
 * @param tableName - Name of table being preserved
 * @param count - Number of documents preserved
 * @param reason - Why these documents were preserved
 */
export function logPreservation(
  tableName: string,
  count: number,
  reason: string
): void {
  console.log(`[VANISH PROTOCOL] Preserved ${count} documents in ${tableName}: ${reason}`);
}
