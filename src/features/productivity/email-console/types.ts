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
}

/**
 * Individual email message
 */
export interface EmailMessage {
  _id: string;
  externalThreadId: string;
  from: Participant;
  to: Participant[];
  receivedAt: number;
  snippet?: string;
  hasAttachments?: boolean;
  resolutionState: 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none';
  aiClassification?: AIClassification;
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
 * FUSE email data structure
 */
export interface ProductivityEmail {
  threads: EmailThread[];
  messages: EmailMessage[];
  accounts: EmailAccount[];
}
