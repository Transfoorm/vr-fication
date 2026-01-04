/**─────────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK CANONICAL - Folder Mapping & Constants                        │
│  /convex/productivity/email/outlookCanonical.ts                           │
│                                                                           │
│  Pure data: canonical folder taxonomy + Outlook mappings                  │
│  No Convex bindings - importable anywhere                                 │
└───────────────────────────────────────────────────────────────────────────┘ */

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL EMAIL TAXONOMY
// Source of truth: /src/domains/email/canonical.ts
// ═══════════════════════════════════════════════════════════════════════════

/** Canonical folder values (provider-agnostic) */
export const CanonicalFolder = {
  INBOX: 'inbox',
  SENT: 'sent',
  DRAFTS: 'drafts',
  ARCHIVE: 'archive',
  SPAM: 'spam',
  TRASH: 'trash',
  OUTBOX: 'outbox',
  SCHEDULED: 'scheduled',
  SYSTEM: 'system',
} as const;

/** Canonical state values (provider metadata) */
export const CanonicalState = {
  UNREAD: 'unread',
  STARRED: 'starred',
  IMPORTANT: 'important',
  SNOOZED: 'snoozed',
  MUTED: 'muted',
  FOCUSED: 'focused',
  OTHER: 'other',
} as const;

export type CanonicalFolderType = (typeof CanonicalFolder)[keyof typeof CanonicalFolder];
export type CanonicalStateType = (typeof CanonicalState)[keyof typeof CanonicalState];

/** Outlook folder name → Canonical folder mapping */
export const OUTLOOK_FOLDER_MAP: Record<string, CanonicalFolderType> = {
  // wellKnownName values
  inbox: CanonicalFolder.INBOX,
  sentitems: CanonicalFolder.SENT,
  drafts: CanonicalFolder.DRAFTS,
  deleteditems: CanonicalFolder.TRASH,
  junkemail: CanonicalFolder.SPAM,
  archive: CanonicalFolder.ARCHIVE,
  outbox: CanonicalFolder.OUTBOX,
  // Display names (fallback)
  'sent items': CanonicalFolder.SENT,
  sent: CanonicalFolder.SENT,
  'deleted items': CanonicalFolder.TRASH,
  trash: CanonicalFolder.TRASH,
  'junk email': CanonicalFolder.SPAM,
  junk: CanonicalFolder.SPAM,
  spam: CanonicalFolder.SPAM,
  scheduled: CanonicalFolder.SCHEDULED,
  // Conditional folders - sync them (map to INBOX so they're not excluded)
  'conversation history': CanonicalFolder.INBOX,
  clutter: CanonicalFolder.INBOX,
  // True system folders - never sync
  'sync issues': CanonicalFolder.SYSTEM,
  conflicts: CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
};

/**
 * Maps Outlook folder to canonical folder.
 * Uses wellKnownName if available, falls back to displayName.
 */
export function mapOutlookFolderToCanonical(
  displayName?: string,
  wellKnownName?: string
): CanonicalFolderType {
  // Try wellKnownName first (most reliable)
  if (wellKnownName) {
    const mapped = OUTLOOK_FOLDER_MAP[wellKnownName.toLowerCase()];
    if (mapped) return mapped;
  }
  // Try displayName
  if (displayName) {
    const mapped = OUTLOOK_FOLDER_MAP[displayName.toLowerCase().trim()];
    if (mapped) return mapped;
  }
  // Unknown → INBOX (custom folders synced like inbox, not excluded)
  return CanonicalFolder.INBOX;
}

/**
 * Extracts canonical states from Outlook message properties.
 */
export function extractOutlookCanonicalStates(message: {
  isRead?: boolean;
  flag?: { flagStatus?: string };
  importance?: string;
  inferenceClassification?: string;
}): CanonicalStateType[] {
  const states: CanonicalStateType[] = [];

  // Unread state
  if (message.isRead === false) {
    states.push(CanonicalState.UNREAD);
  }

  // Flagged → Starred
  if (message.flag?.flagStatus === 'flagged') {
    states.push(CanonicalState.STARRED);
  }

  // High importance → Important
  if (message.importance === 'high') {
    states.push(CanonicalState.IMPORTANT);
  }

  // Focused Inbox classification
  if (message.inferenceClassification === 'focused') {
    states.push(CanonicalState.FOCUSED);
  } else if (message.inferenceClassification === 'other') {
    states.push(CanonicalState.OTHER);
  }

  return states;
}

/** Microsoft Graph message fields to request */
export const MESSAGE_FIELDS = [
  'id',
  'conversationId',
  'subject',
  'from',
  'toRecipients',
  'ccRecipients',
  'receivedDateTime',
  'sentDateTime',
  'hasAttachments',
  'importance',
  'isRead',
  'isDraft',
  'webLink',
  'bodyPreview',
  'inferenceClassification',
  'flag',
  'parentFolderId',
  'categories',
].join(',');

/** Excluded canonical folders (never sync) */
export const EXCLUDED_CANONICAL = ['system'];
