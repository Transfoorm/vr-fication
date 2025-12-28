/**──────────────────────────────────────────────────────────────────────────┐
│  📧 CANONICAL EMAIL TAXONOMY                                               │
│  /src/domains/email/canonical.ts                                           │
│                                                                            │
│  Single source of truth for email folder/state classification.             │
│  Provider-agnostic. UI-agnostic. Guarantees 100% inbox parity.             │
│                                                                            │
│  Rule: Folders describe WHERE mail lives.                                  │
│        States describe HOW mail behaves.                                   │
│        They are never interchangeable.                                     │
└────────────────────────────────────────────────────────────────────────────*/

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL FOLDERS
// UI-visible buckets. Every email maps to exactly one folder.
// ═══════════════════════════════════════════════════════════════════════════

export enum CanonicalFolder {
  /** Primary inbox - unprocessed incoming mail */
  INBOX = 'inbox',

  /** Sent mail - messages user sent */
  SENT = 'sent',

  /** Drafts - unsent compositions */
  DRAFTS = 'drafts',

  /** Archive - processed/stored mail (Gmail: All Mail) */
  ARCHIVE = 'archive',

  /** Spam/Junk - unwanted mail */
  SPAM = 'spam',

  /** Trash/Deleted - mail pending permanent deletion */
  TRASH = 'trash',

  /** Outbox - queued but not yet sent */
  OUTBOX = 'outbox',

  /** Scheduled - send-later queue */
  SCHEDULED = 'scheduled',

  /** System - provider-specific folders (Conversation History, Sync Issues, etc.) */
  SYSTEM = 'system',
}

// ═══════════════════════════════════════════════════════════════════════════
// CANONICAL STATES
// Provider metadata. A message can have multiple states simultaneously.
// These are NEVER folders - they describe behavior, not location.
// ═══════════════════════════════════════════════════════════════════════════

export enum CanonicalState {
  /** Unread - not yet opened/viewed */
  UNREAD = 'unread',

  /** Starred/Flagged - user-marked as important */
  STARRED = 'starred',

  /** Important - provider-determined importance (Gmail) */
  IMPORTANT = 'important',

  /** Snoozed - temporarily hidden, returns later */
  SNOOZED = 'snoozed',

  /** Muted - thread silenced from notifications */
  MUTED = 'muted',

  /** Focused - Outlook Focused Inbox classification */
  FOCUSED = 'focused',

  /** Other - Outlook Other Inbox classification */
  OTHER = 'other',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIL PROVIDER
// Supported email providers (v1 auth scope)
// ═══════════════════════════════════════════════════════════════════════════

export enum MailProvider {
  /** Google Gmail */
  GMAIL = 'gmail',

  /** Microsoft Outlook / Hotmail / Microsoft 365 */
  OUTLOOK = 'outlook',

  /** Yahoo Mail */
  YAHOO = 'yahoo',
}

// ═══════════════════════════════════════════════════════════════════════════
// RESOLUTION STATE
// Transfoorm workflow states. Separate from canonical provider states.
// These represent user action/ownership, not provider metadata.
// ═══════════════════════════════════════════════════════════════════════════

export enum ResolutionState {
  /** Ball is in my court - I need to act */
  WITH_ME = 'with_me',

  /** Ball is in their court - waiting for response */
  WITH_THEM = 'with_them',

  /** Conversation complete - no action needed */
  DONE = 'done',

  /** No resolution state assigned */
  NONE = 'none',
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════════════════════

export function isCanonicalFolder(value: string): value is CanonicalFolder {
  return Object.values(CanonicalFolder).includes(value as CanonicalFolder);
}

export function isCanonicalState(value: string): value is CanonicalState {
  return Object.values(CanonicalState).includes(value as CanonicalState);
}

export function isMailProvider(value: string): value is MailProvider {
  return Object.values(MailProvider).includes(value as MailProvider);
}

export function isResolutionState(value: string): value is ResolutionState {
  return Object.values(ResolutionState).includes(value as ResolutionState);
}

// ═══════════════════════════════════════════════════════════════════════════
// VISIBLE FOLDERS (UI)
// Default sidebar shows only these 6 folders
// ═══════════════════════════════════════════════════════════════════════════

export const VISIBLE_FOLDERS: CanonicalFolder[] = [
  CanonicalFolder.INBOX,
  CanonicalFolder.DRAFTS,
  CanonicalFolder.SENT,
  CanonicalFolder.ARCHIVE,
  CanonicalFolder.TRASH,
  CanonicalFolder.SPAM,
];

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY MAPPING
// For migration from old resolution state names
// ═══════════════════════════════════════════════════════════════════════════

export const LEGACY_RESOLUTION_MAP: Record<string, ResolutionState> = {
  'awaiting_me': ResolutionState.WITH_ME,
  'awaiting_them': ResolutionState.WITH_THEM,
  'resolved': ResolutionState.DONE,
  'none': ResolutionState.NONE,
};

export function migrateLegacyResolutionState(legacy: string): ResolutionState {
  return LEGACY_RESOLUTION_MAP[legacy] ?? ResolutionState.NONE;
}
