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
      // IMPORTANT: Preserve local isRead for messages with pending updates
      // Read pending set directly from store (not as dependency to avoid infinite loop)
      const { pendingReadUpdates, email: currentEmail } = useFuse.getState().productivity;
      const currentMessages = currentEmail?.messages;

      // If there are pending read updates, skip this hydration entirely
      // The local state is correct; we'll hydrate on the next sync after pending clears
      if (pendingReadUpdates.size > 0) {
        console.log(`🛡️ SYNC: Skipping hydration - ${pendingReadUpdates.size} pending updates`);
        return;
      }

      const messages: EmailMessage[] = liveMessages.map((msg) => {
        // If this message has a pending read update, preserve the local value
        const isPending = pendingReadUpdates.has(msg._id);
        const localMsg = isPending ? currentMessages?.find((m) => m._id === msg._id) : null;

        return {
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
          isRead: isPending && localMsg ? localMsg.isRead : msg.isRead,
        };
      });

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

      // 🛡️ MONOTONIC HYDRATION: Never overwrite good data with empty data
      // This ensures WARP-preloaded data survives until live queries return real data
      // Empty data can only occur from timing issues, never from intentional clearing
      if (messages.length === 0 && accounts.length === 0) return;

      // Hydrate FUSE with complete email data
      hydrateProductivity({
        email: { accounts, threads, messages, folders },
      }, 'CONVEX_LIVE');
    }
  }, [liveEmailAccounts, liveThreads, liveMessages, liveFolders, hydrateProductivity, isIdentityStable, callerUserId]);
}
