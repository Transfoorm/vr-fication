/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL CONSOLE TYPES - FUSE Email Data Structure                   │
│  /src/features/productivity/email-console/types.ts                    │
│                                                                        │
│  TypeScript interfaces for email data stored in FUSE                  │
│  Eliminates TAV (Type Any Virus) violations                           │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * Email participant (sender or recipient)
 */
export interface Participant {
  name?: string;
  email: string;
}

/**
 * AI classification metadata for messages
 */
export interface AIClassification {
  intent?: string;
  priority?: 'low' | 'medium' | 'high';
  senderType?: string;
  explanation?: string;
  confidence?: number;
}

/**
 * Email thread summary
 */
export interface EmailThread {
  threadId: string;
  subject: string;
  participants: Participant[];
  state: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none';
  messageCount: number;
  latestMessageAt: number;
  hasUnread?: boolean;
  snippet?: string;
  latestFrom?: Participant;
  /** Canonical folder of latest message (inbox, sent, drafts, trash, spam, etc.) */
  canonicalFolder?: string;
}

/**
 * Individual email message
 */
export interface EmailMessage {
  _id: string;
  externalThreadId: string;
  subject: string;
  from: Participant;
  to: Participant[];
  receivedAt: number;
  snippet?: string;
  hasAttachments?: boolean;
  resolutionState: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none';
  aiClassification?: AIClassification;
  /** Provider folder ID (for subfolder filtering) */
  providerFolderId?: string;
  /** Canonical folder (inbox, sent, drafts, trash, spam, archive) */
  canonicalFolder?: string;
  /** Whether the message has been read */
  isRead: boolean;
}

/**
 * Connected email account
 */
export interface EmailAccount {
  _id: string;
  label: string;
  emailAddress: string;
  provider: 'outlook' | 'gmail';
  status: 'active' | 'error' | 'disconnected';
  syncEnabled: boolean;
  connectedAt?: number;
  lastSyncAt?: number;
  lastSyncError?: string;
}

/**
 * Email folder (for hierarchical sidebar display)
 */
export interface EmailFolder {
  _id: string;
  externalFolderId: string;
  displayName: string;
  canonicalFolder: string;
  parentFolderId?: string;
  childFolderCount: number;
  provider: 'outlook' | 'gmail';
}

/**
 * FUSE email data structure
 */
export interface ProductivityEmail {
  threads: EmailThread[];
  messages: EmailMessage[];
  accounts: EmailAccount[];
  folders: EmailFolder[];
}
