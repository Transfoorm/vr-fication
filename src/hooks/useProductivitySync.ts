/**─────────────────────────────────────────────────────────────────────────┐
│  🌉 GOLDEN BRIDGE - Productivity Domain Sync Hook                         │
│  /src/hooks/useProductivitySync.ts                                        │
│                                                                           │
│  TTTS-2 COMPLIANT: Convex → FUSE Bridge                                   │
│  - useQuery hydrates FUSE store                                           │
│  - Components read via useProductivityData()                              │
│  - NO direct data returns                                                 │
│                                                                           │
│  Exempt from TTTS-7 (no-runtime-debt): Sync hooks are infrastructure      │
└───────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import { sounds } from '@/features/productivity/email-console/sounds';
import type {
  EmailAccount,
  EmailThread,
  EmailMessage,
  EmailFolder,
  Participant,
} from '@/features/productivity/email-console/types';

// Track accounts that have completed initial sync (for connected celebration)
const completedAccountsSet = new Set<string>();

/**
 * Productivity Domain Sync Hook
 *
 * Bridges Convex live data → FUSE store for productivity domain.
 * This hook runs in ProductivityProvider to keep FUSE hydrated.
 *
 * GOLDEN BRIDGE PATTERN:
 * - Sync hook: useQuery() → FUSE (this file)
 * - Reader hook: FUSE → components (useProductivityData.ts)
 * - Components: Never call useQuery directly
 *
 * HYDRATES:
 * - email.accounts (connected email accounts)
 * - email.threads (thread metadata with derived states)
 * - email.messages (individual email messages)
 */
/**
 * Return type for sync hook - includes callback for modal trigger
 */
type ProductivitySyncResult = {
  /** Whether the email connected modal should be shown */
  showConnectedModal: boolean;
  /** Callback to dismiss the modal */
  dismissConnectedModal: () => void;
  /** Email address that just connected (for modal display) */
  connectedEmail: string | null;
};

export function useProductivitySync(): ProductivitySyncResult {
  const hydrateProductivity = useFuse((state) => state.hydrateProductivity);
  const user = useFuse((state) => state.user);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  // Track newEmailsDetectedAt for inbox-first sound notification
  // This fires IMMEDIATELY after inbox sync, not after all folders
  const prevNewEmailsDetectedAtRef = useRef<number | null>(null);

  // Email connected modal state
  const [showConnectedModal, setShowConnectedModal] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const dismissConnectedModal = useCallback(() => {
    setShowConnectedModal(false);
    setConnectedEmail(null);
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // 🛡️ IDENTITY GATE: No queries until user identity is stable
  // This prevents empty query results from overwriting WARP-preloaded data
  // ═══════════════════════════════════════════════════════════════════════
  const isIdentityStable = Boolean(callerUserId);

  // ═══════════════════════════════════════════════════════════════════════
  // 🌉 GOLDEN BRIDGE: Live queries from Convex
  // CRITICAL: ALL queries skip until identity is stable
  // ═══════════════════════════════════════════════════════════════════════

  // Email accounts (connected OAuth accounts)
  const liveEmailAccounts = useQuery(
    api.domains.productivity.queries.listEmailAccounts,
    isIdentityStable ? { callerUserId: callerUserId! } : 'skip'
  );

  // Email threads (grouped messages with derived state)
  const liveThreads = useQuery(
    api.domains.productivity.queries.listThreads,
    isIdentityStable ? { callerUserId: callerUserId! } : 'skip'
  );

  // Email messages (individual messages for reading pane)
  const liveMessages = useQuery(
    api.domains.productivity.queries.listMessages,
    isIdentityStable ? { callerUserId: callerUserId! } : 'skip'
  );

  // Email folders (hierarchical folder structure for sidebar)
  const liveFolders = useQuery(
    api.domains.productivity.queries.listEmailFolders,
    isIdentityStable ? { callerUserId: callerUserId! } : 'skip'
  );

  // ═══════════════════════════════════════════════════════════════════════
  // 🔄 HYDRATION: Transform and sync to FUSE
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    // 🛡️ IDENTITY GATE: Skip effect entirely if identity is not stable
    if (!isIdentityStable) return;

    // Only hydrate when we have data from all sources
    // This prevents partial hydration and race conditions
    if (liveEmailAccounts && liveThreads && liveMessages && liveFolders) {

      // Transform accounts to FUSE format
      const accounts: EmailAccount[] = liveEmailAccounts.map((account) => ({
        _id: account._id,
        label: account.label,
        emailAddress: account.emailAddress,
        provider: account.provider as 'outlook' | 'gmail',
        status: account.status as 'active' | 'error' | 'disconnected',
        syncEnabled: account.syncEnabled,
        connectedAt: account.connectedAt,
        lastSyncAt: account.lastSyncAt,
        lastSyncError: account.lastSyncError,
        isSyncing: account.isSyncing,
      }));

      // Transform threads to FUSE format (ThreadMetadata → EmailThread)
      const threads: EmailThread[] = liveThreads.map((thread) => ({
        threadId: thread.threadId,
        subject: thread.subject,
        participants: thread.participants.map((p): Participant => ({
          name: p.name,
          email: p.email,
        })),
        state: thread.state,
        messageCount: thread.messageCount,
        latestMessageAt: thread.latestMessageAt,
        hasUnread: thread.hasUnread,
        // Additional fields from ThreadMetadata for display
        snippet: thread.snippet,
        latestFrom: thread.latestFrom,
        canonicalFolder: thread.canonicalFolder,
      }));

      // Transform messages to FUSE format (Doc<productivity_email_Index> → EmailMessage)
      // NOTE: Pending read status protection is handled in hydrateProductivity()
      const messages: EmailMessage[] = liveMessages.map((msg) => ({
          _id: msg._id,
          externalThreadId: msg.externalThreadId,
          subject: msg.subject,
          from: {
            name: msg.from.name,
            email: msg.from.email,
          },
          to: msg.to.map((recipient): Participant => ({
            name: recipient.name,
            email: recipient.email,
          })),
          receivedAt: msg.receivedAt,
          snippet: msg.snippet,
          hasAttachments: msg.hasAttachments,
          resolutionState: msg.resolutionState as 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none',
          aiClassification: msg.aiClassification ? {
            intent: msg.aiClassification.intent,
            priority: msg.aiClassification.priority as 'low' | 'medium' | 'high' | undefined,
            senderType: msg.aiClassification.senderType,
            explanation: msg.aiClassification.explanation,
            confidence: msg.aiClassification.confidence,
          } : undefined,
          providerFolderId: msg.providerFolderId,
          canonicalFolder: msg.canonicalFolder,
          isRead: msg.isRead,
        }));

      // Transform folders to FUSE format
      const folders: EmailFolder[] = liveFolders.map((folder) => ({
        _id: folder._id,
        externalFolderId: folder.externalFolderId,
        displayName: folder.displayName,
        canonicalFolder: folder.canonicalFolder,
        parentFolderId: folder.parentFolderId,
        childFolderCount: folder.childFolderCount,
        provider: folder.provider as 'outlook' | 'gmail',
      }));

      // ═══════════════════════════════════════════════════════════════════════
      // 🔔 EMAIL SOUND LOGIC
      // ═══════════════════════════════════════════════════════════════════════
      //
      // 1. CONNECTED SOUND: Plays when an account completes initial sync for first time
      //    - Only plays ONCE per account (tracked in completedAccountsSet)
      //    - Shows celebration modal
      //
      // 2. RECEIVE SOUND: Plays when new emails arrive (newEmailsDetectedAt changes)
      //    - SUPPRESSED during initial sync (would fire many times)
      //    - Only plays after ALL accounts have completed initial sync
      // ═══════════════════════════════════════════════════════════════════════

      // Check for accounts that just completed initial sync
      for (const acc of liveEmailAccounts) {
        const typedAcc = acc as { _id: string; emailAddress: string; initialSyncComplete?: boolean };
        if (typedAcc.initialSyncComplete && !completedAccountsSet.has(typedAcc._id)) {
          // First time this account completed sync!
          completedAccountsSet.add(typedAcc._id);
          // Sound + confetti fired from modal's useEffect for reliable timing
          setConnectedEmail(typedAcc.emailAddress);
          setShowConnectedModal(true);
        }
      }

      // Check if ALL accounts have completed initial sync
      const allAccountsSynced = liveEmailAccounts.every((acc) => {
        const typedAcc = acc as { initialSyncComplete?: boolean };
        return typedAcc.initialSyncComplete === true;
      });

      // Only play receive sound if all accounts are fully synced
      // This prevents the sound firing many times during initial download
      if (allAccountsSynced) {
        const latestDetectedAt = liveEmailAccounts.reduce((max, acc) => {
          const ts = (acc as { newEmailsDetectedAt?: number }).newEmailsDetectedAt ?? 0;
          return ts > max ? ts : max;
        }, 0);

        if (prevNewEmailsDetectedAtRef.current !== null && latestDetectedAt > prevNewEmailsDetectedAtRef.current) {
          sounds.receive();
        }
        prevNewEmailsDetectedAtRef.current = latestDetectedAt;
      }

      // Hydrate FUSE with complete email data
      hydrateProductivity({
        email: { accounts, threads, messages, folders },
      }, 'CONVEX_LIVE');
    }
  }, [liveEmailAccounts, liveThreads, liveMessages, liveFolders, hydrateProductivity, isIdentityStable, callerUserId]);

  return {
    showConnectedModal,
    dismissConnectedModal,
    connectedEmail,
  };
}
