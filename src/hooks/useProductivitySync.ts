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

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import type {
  EmailAccount,
  EmailThread,
  EmailMessage,
  EmailFolder,
  Participant,
} from '@/features/productivity/email-console/types';

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
export function useProductivitySync(): void {
  const hydrateProductivity = useFuse((state) => state.hydrateProductivity);
  const user = useFuse((state) => state.user);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  // ═══════════════════════════════════════════════════════════════════════
  // 🌉 GOLDEN BRIDGE: Live queries from Convex
  // ═══════════════════════════════════════════════════════════════════════

  // Email accounts (connected OAuth accounts)
  const liveEmailAccounts = useQuery(
    api.domains.productivity.queries.listEmailAccounts,
    callerUserId ? { callerUserId } : 'skip'
  );

  // Email threads (grouped messages with derived state)
  const liveThreads = useQuery(
    api.domains.productivity.queries.listThreads,
    callerUserId ? { callerUserId } : 'skip'
  );

  // Email messages (individual messages for reading pane)
  const liveMessages = useQuery(
    api.domains.productivity.queries.listMessages,
    callerUserId ? { callerUserId } : 'skip'
  );

  // Email folders (hierarchical folder structure for sidebar)
  const liveFolders = useQuery(
    api.domains.productivity.queries.listEmailFolders,
    callerUserId ? { callerUserId } : 'skip'
  );

  // ═══════════════════════════════════════════════════════════════════════
  // 🔄 HYDRATION: Transform and sync to FUSE
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
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

      // Hydrate FUSE with complete email data
      hydrateProductivity({
        email: { accounts, threads, messages, folders },
      }, 'CONVEX_LIVE');
    }
  }, [liveEmailAccounts, liveThreads, liveMessages, liveFolders, hydrateProductivity]);
}
