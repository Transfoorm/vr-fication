/**──────────────────────────────────────────────────────────────────────────┐
│  📧 YAHOO → CANONICAL MAPPING                                              │
│  /src/domains/email/mappings/yahoo.ts                                      │
│                                                                            │
│  Maps Yahoo Mail folders and states to canonical taxonomy.                 │
│  NOTE: Yahoo OAuth not implemented in v1. This is spec-only.               │
└────────────────────────────────────────────────────────────────────────────*/

import { CanonicalFolder, CanonicalState } from '@/domains/email/canonical';

// ═══════════════════════════════════════════════════════════════════════════
// YAHOO FOLDER NAMES
// Standard Yahoo Mail folder names
// ═══════════════════════════════════════════════════════════════════════════

/** @internal Standard Yahoo Mail folder names for reference */
const _YAHOO_FOLDERS = {
  INBOX: 'Inbox',
  SENT: 'Sent',
  DRAFTS: 'Draft',
  TRASH: 'Trash',
  BULK: 'Bulk',  // Yahoo's spam folder
  ARCHIVE: 'Archive',
} as const;

// Exported for documentation/testing purposes
export { _YAHOO_FOLDERS as YahooFolders };

// ═══════════════════════════════════════════════════════════════════════════
// FOLDER MAPPING
// Yahoo folder → Canonical folder
// ═══════════════════════════════════════════════════════════════════════════

const YAHOO_FOLDER_MAP: Record<string, CanonicalFolder> = {
  // Standard folders (case-insensitive)
  'inbox': CanonicalFolder.INBOX,
  'sent': CanonicalFolder.SENT,
  'draft': CanonicalFolder.DRAFTS,
  'drafts': CanonicalFolder.DRAFTS,
  'trash': CanonicalFolder.TRASH,
  'bulk': CanonicalFolder.SPAM,  // Yahoo calls spam "Bulk"
  'spam': CanonicalFolder.SPAM,
  'archive': CanonicalFolder.ARCHIVE,
};

/**
 * Maps a Yahoo folder to a canonical folder.
 *
 * @param folderName - Folder name from Yahoo API
 * @returns Canonical folder
 */
export function mapYahooFolder(folderName: string): CanonicalFolder {
  const normalizedName = folderName.toLowerCase().trim();
  const mapped = YAHOO_FOLDER_MAP[normalizedName];

  if (mapped) return mapped;

  // Custom user folders → SYSTEM (preserved, not dropped)
  return CanonicalFolder.SYSTEM;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE EXTRACTION
// Yahoo message properties → Canonical states
// ═══════════════════════════════════════════════════════════════════════════

export interface YahooMessageFlags {
  isRead?: boolean;
  isStarred?: boolean;
  isFlagged?: boolean;
}

/**
 * Extracts canonical states from Yahoo message properties.
 *
 * @param message - Yahoo message properties
 * @returns Array of canonical states
 */
export function extractYahooStates(message: YahooMessageFlags): CanonicalState[] {
  const states: CanonicalState[] = [];

  // Unread state
  if (message.isRead === false) {
    states.push(CanonicalState.UNREAD);
  }

  // Starred/Flagged
  if (message.isStarred || message.isFlagged) {
    states.push(CanonicalState.STARRED);
  }

  return states;
}

// ═══════════════════════════════════════════════════════════════════════════
// FULL MESSAGE MAPPING
// Complete mapping of a Yahoo message to canonical taxonomy
// ═══════════════════════════════════════════════════════════════════════════

export interface YahooCanonicalMapping {
  canonicalFolder: CanonicalFolder;
  canonicalStates: CanonicalState[];
  providerFolderId: string;
  providerFolderName: string;
}

export interface YahooMessageInput {
  folderId: string;
  folderName: string;
  isRead?: boolean;
  isStarred?: boolean;
  isFlagged?: boolean;
}

/**
 * Maps a Yahoo message to full canonical taxonomy.
 *
 * @param message - Yahoo message data
 * @returns Complete canonical mapping
 */
export function mapYahooMessage(message: YahooMessageInput): YahooCanonicalMapping {
  return {
    canonicalFolder: mapYahooFolder(message.folderName),
    canonicalStates: extractYahooStates({
      isRead: message.isRead,
      isStarred: message.isStarred,
      isFlagged: message.isFlagged,
    }),
    providerFolderId: message.folderId,
    providerFolderName: message.folderName,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION NOTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Yahoo Mail OAuth implementation is deferred to v2.
 *
 * This mapping file exists for:
 * 1. Architectural completeness
 * 2. Preventing false assumptions ("email only means Google/Microsoft")
 * 3. Future-proofing without rewrites
 *
 * When implementing Yahoo OAuth:
 * 1. Use Yahoo Mail API (not IMAP)
 * 2. Handle folder names as above
 * 3. Map states using extractYahooStates
 * 4. Store custom folders in SYSTEM bucket
 */
