/**──────────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK → CANONICAL MAPPING                                            │
│  /src/domains/email/mappings/outlook.ts                                    │
│                                                                            │
│  Maps Outlook/Microsoft 365 folders and states to canonical taxonomy.      │
│  Covers Outlook.com, Hotmail, and Microsoft 365 accounts.                  │
└────────────────────────────────────────────────────────────────────────────*/

import { CanonicalFolder, CanonicalState } from '@/domains/email/canonical';

// ═══════════════════════════════════════════════════════════════════════════
// OUTLOOK WELL-KNOWN FOLDER NAMES
// These are the displayName values returned by Microsoft Graph API
// Also includes wellKnownName values where available
// ═══════════════════════════════════════════════════════════════════════════

const OUTLOOK_FOLDERS = {
  // Primary folders (wellKnownName)
  INBOX: 'inbox',
  SENT_ITEMS: 'sentitems',
  DRAFTS: 'drafts',
  DELETED_ITEMS: 'deleteditems',
  JUNK_EMAIL: 'junkemail',
  ARCHIVE: 'archive',
  OUTBOX: 'outbox',

  // Display names (fallback matching)
  INBOX_DISPLAY: 'Inbox',
  SENT_DISPLAY: 'Sent Items',
  DRAFTS_DISPLAY: 'Drafts',
  DELETED_DISPLAY: 'Deleted Items',
  JUNK_DISPLAY: 'Junk Email',
  ARCHIVE_DISPLAY: 'Archive',
  OUTBOX_DISPLAY: 'Outbox',

  // Special folders
  CONVERSATION_HISTORY: 'Conversation History',
  SYNC_ISSUES: 'Sync Issues',
  CONFLICTS: 'Conflicts',
  LOCAL_FAILURES: 'Local Failures',
  SERVER_FAILURES: 'Server Failures',
  SCHEDULED: 'Scheduled',
  CLUTTER: 'Clutter',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER MAPPING
// Outlook folder → Canonical folder
// ═══════════════════════════════════════════════════════════════════════════

const OUTLOOK_FOLDER_MAP: Record<string, CanonicalFolder> = {
  // wellKnownName values (from Microsoft Graph API)
  [OUTLOOK_FOLDERS.INBOX]: CanonicalFolder.INBOX,         // 'inbox'
  [OUTLOOK_FOLDERS.SENT_ITEMS]: CanonicalFolder.SENT,     // 'sentitems'
  [OUTLOOK_FOLDERS.DRAFTS]: CanonicalFolder.DRAFTS,       // 'drafts'
  [OUTLOOK_FOLDERS.DELETED_ITEMS]: CanonicalFolder.TRASH, // 'deleteditems'
  [OUTLOOK_FOLDERS.JUNK_EMAIL]: CanonicalFolder.SPAM,     // 'junkemail'
  [OUTLOOK_FOLDERS.ARCHIVE]: CanonicalFolder.ARCHIVE,     // 'archive'
  [OUTLOOK_FOLDERS.OUTBOX]: CanonicalFolder.OUTBOX,       // 'outbox'

  // Display name variants (non-overlapping with wellKnownName)
  'sent items': CanonicalFolder.SENT,
  'sent': CanonicalFolder.SENT,
  'deleted items': CanonicalFolder.TRASH,
  'trash': CanonicalFolder.TRASH,
  'junk email': CanonicalFolder.SPAM,
  'junk': CanonicalFolder.SPAM,
  'spam': CanonicalFolder.SPAM,
  'scheduled': CanonicalFolder.SCHEDULED,

  // System folders
  'conversation history': CanonicalFolder.SYSTEM,
  'sync issues': CanonicalFolder.SYSTEM,
  'conflicts': CanonicalFolder.SYSTEM,
  'local failures': CanonicalFolder.SYSTEM,
  'server failures': CanonicalFolder.SYSTEM,
  'clutter': CanonicalFolder.SYSTEM,
};

/**
 * Maps an Outlook folder to a canonical folder.
 *
 * @param folderName - Folder displayName or wellKnownName from Graph API
 * @param wellKnownName - Optional wellKnownName if available
 * @returns Canonical folder
 */
export function mapOutlookFolder(
  folderName: string,
  wellKnownName?: string
): CanonicalFolder {
  // Try wellKnownName first (most reliable)
  if (wellKnownName) {
    const mapped = OUTLOOK_FOLDER_MAP[wellKnownName.toLowerCase()];
    if (mapped) return mapped;
  }

  // Try displayName (case-insensitive)
  const normalizedName = folderName.toLowerCase().trim();
  const mapped = OUTLOOK_FOLDER_MAP[normalizedName];
  if (mapped) return mapped;

  // Unknown folder → SYSTEM (preserved, not dropped)
  return CanonicalFolder.SYSTEM;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE EXTRACTION
// Outlook message properties → Canonical states
// ═══════════════════════════════════════════════════════════════════════════

export interface OutlookMessageFlags {
  isRead?: boolean;
  flag?: {
    flagStatus?: 'notFlagged' | 'flagged' | 'complete';
  };
  importance?: 'low' | 'normal' | 'high';
  inferenceClassification?: 'focused' | 'other';
}

/**
 * Extracts canonical states from Outlook message properties.
 *
 * @param message - Outlook message properties from Graph API
 * @returns Array of canonical states
 */
export function extractOutlookStates(message: OutlookMessageFlags): CanonicalState[] {
  const states: CanonicalState[] = [];

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

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY EXTRACTION
// Outlook categories → metadata array
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Extracts Outlook categories for metadata storage.
 * Categories in Outlook are user-defined color-coded tags.
 *
 * @param categories - Array of category names from message
 * @returns Array of category names (preserved as-is)
 */
export function extractOutlookCategories(categories?: string[]): string[] {
  return categories ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL MESSAGE MAPPING
// Complete mapping of an Outlook message to canonical taxonomy
// ═══════════════════════════════════════════════════════════════════════════

export interface OutlookCanonicalMapping {
  canonicalFolder: CanonicalFolder;
  canonicalStates: CanonicalState[];
  providerFolderId: string;
  providerFolderName: string;
  providerCategories: string[];
}

export interface OutlookMessageInput {
  parentFolderId: string;
  folderDisplayName?: string;
  folderWellKnownName?: string;
  isRead?: boolean;
  flag?: {
    flagStatus?: 'notFlagged' | 'flagged' | 'complete';
  };
  importance?: 'low' | 'normal' | 'high';
  inferenceClassification?: 'focused' | 'other';
  categories?: string[];
}

/**
 * Maps an Outlook message to full canonical taxonomy.
 *
 * @param message - Outlook message data from Graph API
 * @returns Complete canonical mapping
 */
export function mapOutlookMessage(message: OutlookMessageInput): OutlookCanonicalMapping {
  const folderName = message.folderDisplayName ?? 'Unknown';

  return {
    canonicalFolder: mapOutlookFolder(folderName, message.folderWellKnownName),
    canonicalStates: extractOutlookStates({
      isRead: message.isRead,
      flag: message.flag,
      importance: message.importance,
      inferenceClassification: message.inferenceClassification,
    }),
    providerFolderId: message.parentFolderId,
    providerFolderName: folderName,
    providerCategories: extractOutlookCategories(message.categories),
  };
}
