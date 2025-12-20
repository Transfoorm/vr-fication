/**─────────────────────────────────────────────────────────────────────────┐
│  🎭 VANISH PROTOCOL 2.0 - ANONYMIZE STRATEGY                              │
│  /convex/vanish/strategies/anonymizeStrategy.ts                           │
│                                                                           │
│  Scrubs PII and replaces user references with "deleted-user" placeholder. │
│  Preserves document structure for audit trails and shared data.           │
│                                                                           │
│  Examples:                                                                │
│  - Messages where senderId should be anonymized but thread preserved      │
│  - Comments where author should be anonymized but content preserved       │
│  - Audit logs where createdBy should be anonymized for compliance         │
│  - Projects where createdBy should be anonymized but ownerId deleted      │
└───────────────────────────────────────────────────────────────────────────┘ */

import { DatabaseWriter } from "@/convex/_generated/server";
import type { Id, TableNames } from "@/convex/_generated/dataModel";

/**
 * Deleted user placeholder ID
 * This is a well-known constant that represents anonymized users
 */
export const DELETED_USER_PLACEHOLDER = "deleted-user" as const;

// Type for a document with at least an _id field and other string-indexed properties
type DocumentWithId = {
  _id: Id<TableNames>;
  [key: string]: unknown;
};

/**
 * Fields to scrub when anonymizing
 * These are common PII fields that should be removed
 */
const PII_FIELDS_TO_SCRUB = [
  'email',
  'firstName',
  'lastName',
  'fullName',
  'displayName',
  'phoneNumber',
  'address',
  'ipAddress',
  'userAgent',
] as const;

/**
 * ANONYMIZE STRATEGY
 *
 * Replaces user reference with "deleted-user" placeholder and scrubs PII.
 * Preserves document structure for relationships and audit trails.
 *
 * @param db - Convex database writer
 * @param doc - Document to anonymize
 * @param fieldName - Name of the user reference field to anonymize
 * @returns void
 *
 * IDEMPOTENCY: Safe to call multiple times - no-op if already anonymized
 * PRESERVATION: Document remains queryable, but user identity is removed
 */
export async function executeAnonymizeStrategy(
  db: DatabaseWriter,
  doc: DocumentWithId,
  fieldName: string
): Promise<void> {
  // Check if already anonymized
  if (doc[fieldName] === DELETED_USER_PLACEHOLDER) {
    return; // Already anonymized - idempotent
  }

  // Build patch object
  const patch: Record<string, unknown> = {
    [fieldName]: DELETED_USER_PLACEHOLDER,
  };

  // Scrub any PII fields present in the document
  for (const piiField of PII_FIELDS_TO_SCRUB) {
    if (piiField in doc) {
      patch[piiField] = '[REDACTED]';
    }
  }

  // Add anonymization metadata
  patch.anonymizedAt = Date.now();
  patch.anonymizedReason = 'User deletion cascade';

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
 * BATCH ANONYMIZE
 *
 * Anonymizes multiple documents in a single operation.
 *
 * @param db - Convex database writer
 * @param docs - Array of documents to anonymize
 * @param fieldName - Name of the user reference field to anonymize
 * @returns Number of documents anonymized
 */
export async function executeBatchAnonymize(
  db: DatabaseWriter,
  docs: DocumentWithId[],
  fieldName: string
): Promise<number> {
  let anonymizedCount = 0;

  for (const doc of docs) {
    try {
      await executeAnonymizeStrategy(db, doc, fieldName);
      anonymizedCount++;
    } catch (error) {
      // Continue on errors for fail-resume
      if (error instanceof Error && !error.message.includes('does not exist')) {
        console.error(`Failed to anonymize doc ${doc._id}:`, error.message);
      }
    }
  }

  return anonymizedCount;
}

/**
 * CHECK IF ANONYMIZED
 *
 * Utility to check if a document has been anonymized.
 *
 * @param doc - Document to check
 * @param fieldName - Field to check
 * @returns true if anonymized
 */
export function isAnonymized(doc: DocumentWithId, fieldName: string): boolean {
  return doc[fieldName] === DELETED_USER_PLACEHOLDER;
}
