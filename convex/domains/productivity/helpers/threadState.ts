/**─────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL THREAD STATE DERIVATION - Pure Function                         │
│  /convex/domains/productivity/helpers/threadState.ts                      │
│                                                                           │
│  DOCTRINE:                                                                │
│  - Thread state is DERIVED, never stored                                  │
│  - Pure function (no side effects, no database access)                    │
│  - Single source of truth: message resolutionState fields                 │
│                                                                           │
│  See: /docs/EMAIL_THREAD_STATE_DERIVATION.md                              │
└───────────────────────────────────────────────────────────────────────────┘ */

import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Thread state (derived, never persisted)
 */
export type ThreadState = "awaiting_me" | "awaiting_them" | "resolved" | "none";

/**
 * Message metadata required for thread state derivation
 */
export interface MessageForThreadState {
  resolutionState: "awaiting_me" | "awaiting_them" | "resolved" | "none";
  from: { email: string };
  receivedAt: number;
}

/**
 * 🎯 DERIVE THREAD STATE (Pure Function)
 *
 * Computes thread state from message resolution states.
 * This is the CANONICAL algorithm for thread state derivation.
 *
 * RULES (in priority order):
 * 1. If ANY message is "awaiting_me" → thread is "awaiting_me"
 * 2. If ALL messages are "resolved" → thread is "resolved"
 * 3. If last message from me + not awaiting_me → "awaiting_them"
 * 4. Default → "none"
 *
 * @param messages - Array of messages in thread (from productivity_email_Index)
 * @param currentUserEmail - Email address of current user
 * @returns Derived thread state
 *
 * @example
 * ```ts
 * const messages = [
 *   { resolutionState: "none", from: { email: "client@example.com" }, receivedAt: 1000 },
 *   { resolutionState: "awaiting_me", from: { email: "client@example.com" }, receivedAt: 2000 },
 * ];
 * const threadState = deriveThreadState(messages, "me@example.com");
 * // Returns: "awaiting_me" (Rule 1)
 * ```
 */
export function deriveThreadState(
  messages: MessageForThreadState[],
  currentUserEmail: string
): ThreadState {
  // Edge case: No messages
  if (messages.length === 0) {
    return "none";
  }

  // Sort messages by receivedAt (oldest first)
  const sorted = [...messages].sort((a, b) => a.receivedAt - b.receivedAt);

  // Count resolution states
  const stateCount = {
    awaiting_me: 0,
    awaiting_them: 0,
    resolved: 0,
    none: 0,
  };

  for (const msg of sorted) {
    stateCount[msg.resolutionState]++;
  }

  // Get last message
  const lastMessage = sorted[sorted.length - 1];

  // RULE 1: If ANY message is awaiting_me → thread is awaiting_me
  if (stateCount.awaiting_me > 0) {
    return "awaiting_me";
  }

  // RULE 2: If ALL messages are resolved → thread is resolved
  if (sorted.every(m => m.resolutionState === "resolved")) {
    return "resolved";
  }

  // RULE 3: If last message from me + not awaiting_me → awaiting_them
  if (lastMessage.from.email.toLowerCase() === currentUserEmail.toLowerCase()) {
    return "awaiting_them";
  }

  // RULE 4: Default to "none"
  return "none";
}

/**
 * 📊 GROUP MESSAGES BY THREAD
 *
 * Groups email messages by externalThreadId for batch processing.
 *
 * @param messages - Array of email index messages
 * @returns Map of threadId → messages[]
 */
export function groupMessagesByThread(
  messages: Doc<"productivity_email_Index">[]
): Map<string, Doc<"productivity_email_Index">[]> {
  const grouped = new Map<string, Doc<"productivity_email_Index">[]>();

  for (const message of messages) {
    const threadId = message.externalThreadId;
    const existing = grouped.get(threadId) || [];
    existing.push(message);
    grouped.set(threadId, existing);
  }

  return grouped;
}

/**
 * 🧮 COMPUTE THREAD METADATA
 *
 * Derives thread-level metadata from constituent messages.
 *
 * @param messages - Array of messages in thread (must be from same thread)
 * @param currentUserEmail - Current user's email address
 * @returns Thread metadata
 */
export interface ThreadMetadata {
  threadId: string;
  state: ThreadState;
  messageCount: number;
  latestMessageAt: number;
  subject: string;
  snippet: string;
  latestFrom: { name: string; email: string };
  participants: Array<{ name: string; email: string }>;
  hasUnread: boolean;
  /** Canonical folder of latest message (inbox, sent, drafts, trash, spam, etc.) */
  canonicalFolder: string;
}

export function computeThreadMetadata(
  messages: Doc<"productivity_email_Index">[],
  currentUserEmail: string
): ThreadMetadata {
  if (messages.length === 0) {
    throw new Error("Cannot compute metadata for empty thread");
  }

  // Ensure all messages are from same thread
  const threadIds = new Set(messages.map(m => m.externalThreadId));
  if (threadIds.size > 1) {
    throw new Error("Messages must all be from same thread");
  }

  // Sort by receivedAt (oldest first)
  const sorted = [...messages].sort((a, b) => a.receivedAt - b.receivedAt);

  // Get latest message
  const latest = sorted[sorted.length - 1];

  // Derive thread state
  const state = deriveThreadState(sorted, currentUserEmail);

  // Collect unique participants
  const participantMap = new Map<string, { name: string; email: string }>();
  for (const msg of sorted) {
    // Add sender
    participantMap.set(msg.from.email.toLowerCase(), {
      name: msg.from.name,
      email: msg.from.email,
    });
    // Add recipients
    for (const recipient of msg.to) {
      participantMap.set(recipient.email.toLowerCase(), {
        name: recipient.name,
        email: recipient.email,
      });
    }
    // Add CC recipients
    if (msg.cc) {
      for (const cc of msg.cc) {
        participantMap.set(cc.email.toLowerCase(), {
          name: cc.name,
          email: cc.email,
        });
      }
    }
  }

  // Check for unread messages
  const hasUnread = sorted.some(m => !m.isRead);

  return {
    threadId: latest.externalThreadId,
    state,
    messageCount: messages.length,
    latestMessageAt: latest.receivedAt,
    subject: latest.subject,
    snippet: latest.snippet,
    latestFrom: { name: latest.from.name, email: latest.from.email },
    participants: Array.from(participantMap.values()),
    hasUnread,
    canonicalFolder: latest.canonicalFolder || 'inbox', // Default to inbox for legacy data
  };
}
