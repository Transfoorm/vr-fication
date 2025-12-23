/**──────────────────────────────────────────────────────────────────────┐
│  📧 OUTLOOK INTEGRATION TYPES                                          │
│  /src/features/productivity/email-console/_shared/outlook-types.ts    │
│                                                                        │
│  Microsoft Graph API response types for email sync                    │
│  https://learn.microsoft.com/en-us/graph/api/user-list-messages       │
└────────────────────────────────────────────────────────────────────────┘ */

/**
 * Microsoft Graph API - Email Address
 */
export interface OutlookEmailAddress {
  name?: string;
  address: string;
}

/**
 * Microsoft Graph API - Recipient
 */
export interface OutlookRecipient {
  emailAddress: OutlookEmailAddress;
}

/**
 * Microsoft Graph API - Message
 *
 * Metadata only - we don't fetch body initially for performance
 */
export interface OutlookMessage {
  id: string;
  conversationId: string; // Thread grouping key
  subject: string;
  from: OutlookRecipient;
  toRecipients: OutlookRecipient[];
  ccRecipients?: OutlookRecipient[];
  receivedDateTime: string; // ISO 8601
  sentDateTime: string; // ISO 8601
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  isRead: boolean;
  isDraft: boolean;
  webLink: string;
  bodyPreview: string; // First 255 characters
  inferenceClassification?: 'focused' | 'other'; // Focused Inbox
  flag?: {
    flagStatus: 'notFlagged' | 'complete' | 'flagged';
  };
}

/**
 * Microsoft Graph API - Messages List Response
 */
export interface OutlookMessagesResponse {
  '@odata.context': string;
  '@odata.nextLink'?: string; // Pagination
  value: OutlookMessage[];
}

/**
 * OAuth Token Response from Microsoft
 */
export interface OutlookTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Seconds until expiration
  token_type: 'Bearer';
  scope: string;
}

/**
 * Stored OAuth Tokens (encrypted in Convex)
 */
export interface OutlookTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Timestamp when token expires
  scope: string;
}

/**
 * Sync Status
 */
export interface OutlookSyncStatus {
  lastSyncAt?: number;
  lastSyncSuccess: boolean;
  lastSyncError?: string;
  totalMessagesSynced: number;
  totalThreadsSynced: number;
}
