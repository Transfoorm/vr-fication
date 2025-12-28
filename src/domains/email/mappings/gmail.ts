/**──────────────────────────────────────────────────────────────────────────┐
│  📧 GMAIL → CANONICAL MAPPING                                              │
│  /src/domains/email/mappings/gmail.ts                                      │
│                                                                            │
│  Maps Gmail-specific folders, labels, and states to canonical taxonomy.    │
│  Guarantees no Gmail mail is lost or unmapped.                             │
└────────────────────────────────────────────────────────────────────────────*/

import { CanonicalFolder, CanonicalState } from '@/domains/email/canonical';

// ═══════════════════════════════════════════════════════════════════════════
// GMAIL SYSTEM LABELS
// These are the well-known Gmail label IDs returned by the API
// ═══════════════════════════════════════════════════════════════════════════

const GMAIL_SYSTEM_LABELS = {
  INBOX: 'INBOX',
  SENT: 'SENT',
  DRAFT: 'DRAFT',
  SPAM: 'SPAM',
  TRASH: 'TRASH',
  STARRED: 'STARRED',
  IMPORTANT: 'IMPORTANT',
  UNREAD: 'UNREAD',

  // Categories
  CATEGORY_PERSONAL: 'CATEGORY_PERSONAL',
  CATEGORY_SOCIAL: 'CATEGORY_SOCIAL',
  CATEGORY_PROMOTIONS: 'CATEGORY_PROMOTIONS',
  CATEGORY_UPDATES: 'CATEGORY_UPDATES',
  CATEGORY_FORUMS: 'CATEGORY_FORUMS',

  // Special
  CHAT: 'CHAT',
  SNOOZED: 'SNOOZED',
  SCHEDULED: 'SCHEDULED',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER MAPPING
// Gmail label → Canonical folder
// ═══════════════════════════════════════════════════════════════════════════

/** @internal Reference mapping - actual logic uses priority-based assignment */
const _GMAIL_FOLDER_MAP: Record<string, CanonicalFolder> = {
  [GMAIL_SYSTEM_LABELS.INBOX]: CanonicalFolder.INBOX,
  [GMAIL_SYSTEM_LABELS.SENT]: CanonicalFolder.SENT,
  [GMAIL_SYSTEM_LABELS.DRAFT]: CanonicalFolder.DRAFTS,
  [GMAIL_SYSTEM_LABELS.SPAM]: CanonicalFolder.SPAM,
  [GMAIL_SYSTEM_LABELS.TRASH]: CanonicalFolder.TRASH,
  [GMAIL_SYSTEM_LABELS.SCHEDULED]: CanonicalFolder.SCHEDULED,
  [GMAIL_SYSTEM_LABELS.CHAT]: CanonicalFolder.SYSTEM,
};

// Exported for documentation/testing purposes
export { _GMAIL_FOLDER_MAP as GmailFolderMap };

/**
 * Maps a Gmail label to a canonical folder.
 *
 * Gmail uses labels, not folders. A message can have multiple labels.
 * This function determines the PRIMARY folder for a message.
 *
 * Priority order:
 * 1. TRASH (if deleted)
 * 2. SPAM (if marked spam)
 * 3. DRAFT (if unsent)
 * 4. SENT (if in sent)
 * 5. INBOX (if in inbox)
 * 6. SCHEDULED (if scheduled)
 * 7. ARCHIVE (default - All Mail)
 */
export function mapGmailFolder(labels: string[]): CanonicalFolder {
  const labelSet = new Set(labels.map(l => l.toUpperCase()));

  // Priority-based folder assignment
  if (labelSet.has(GMAIL_SYSTEM_LABELS.TRASH)) return CanonicalFolder.TRASH;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.SPAM)) return CanonicalFolder.SPAM;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.DRAFT)) return CanonicalFolder.DRAFTS;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.SENT)) return CanonicalFolder.SENT;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.INBOX)) return CanonicalFolder.INBOX;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.SCHEDULED)) return CanonicalFolder.SCHEDULED;
  if (labelSet.has(GMAIL_SYSTEM_LABELS.CHAT)) return CanonicalFolder.SYSTEM;

  // Default: Archive (All Mail without specific folder)
  return CanonicalFolder.ARCHIVE;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE EXTRACTION
// Gmail labels → Canonical states
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts canonical states from Gmail labels.
 *
 * Unlike folders, a message can have multiple states.
 * Returns array of all applicable states.
 */
export function extractGmailStates(labels: string[]): CanonicalState[] {
  const labelSet = new Set(labels.map(l => l.toUpperCase()));
  const states: CanonicalState[] = [];

  if (labelSet.has(GMAIL_SYSTEM_LABELS.UNREAD)) {
    states.push(CanonicalState.UNREAD);
  }

  if (labelSet.has(GMAIL_SYSTEM_LABELS.STARRED)) {
    states.push(CanonicalState.STARRED);
  }

  if (labelSet.has(GMAIL_SYSTEM_LABELS.IMPORTANT)) {
    states.push(CanonicalState.IMPORTANT);
  }

  if (labelSet.has(GMAIL_SYSTEM_LABELS.SNOOZED)) {
    states.push(CanonicalState.SNOOZED);
  }

  return states;
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY EXTRACTION
// Gmail categories → metadata array (not states)
// ═══════════════════════════════════════════════════════════════════════════

const GMAIL_CATEGORIES = [
  GMAIL_SYSTEM_LABELS.CATEGORY_PERSONAL,
  GMAIL_SYSTEM_LABELS.CATEGORY_SOCIAL,
  GMAIL_SYSTEM_LABELS.CATEGORY_PROMOTIONS,
  GMAIL_SYSTEM_LABELS.CATEGORY_UPDATES,
  GMAIL_SYSTEM_LABELS.CATEGORY_FORUMS,
];

/**
 * Extracts Gmail categories for metadata storage.
 * These are stored but not mapped to canonical states.
 */
export function extractGmailCategories(labels: string[]): string[] {
  return labels.filter(label =>
    GMAIL_CATEGORIES.includes(label.toUpperCase() as typeof GMAIL_CATEGORIES[number])
  );
}

/**
 * Extracts user-defined labels (not system labels).
 * These are stored in providerLabels for preservation.
 */
export function extractGmailUserLabels(labels: string[]): string[] {
  const systemLabels: Set<string> = new Set([
    ...Object.values(GMAIL_SYSTEM_LABELS),
    ...GMAIL_CATEGORIES,
  ]);

  return labels.filter(label => !systemLabels.has(label.toUpperCase()));
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL MESSAGE MAPPING
// Complete mapping of a Gmail message to canonical taxonomy
// ═══════════════════════════════════════════════════════════════════════════

export interface GmailCanonicalMapping {
  canonicalFolder: CanonicalFolder;
  canonicalStates: CanonicalState[];
  providerLabels: string[];
  providerCategories: string[];
}

/**
 * Maps a Gmail message (by its labels) to full canonical taxonomy.
 *
 * @param labels - Array of Gmail label IDs from the message
 * @returns Complete canonical mapping
 */
export function mapGmailMessage(labels: string[]): GmailCanonicalMapping {
  return {
    canonicalFolder: mapGmailFolder(labels),
    canonicalStates: extractGmailStates(labels),
    providerLabels: extractGmailUserLabels(labels),
    providerCategories: extractGmailCategories(labels),
  };
}
