'use client';

import { useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import { sounds } from './sounds';

// Module-level reconciliation queue (survives re-renders, shared across hook instances)
// Accumulates message IDs from multiple rate-limited batches, runs ONE reconciliation
let pendingReconcileTimer: NodeJS.Timeout | null = null;
let pendingReconcileIds: Set<string> = new Set();

interface ContextMenuState {
  x: number;
  y: number;
  area: 'mailbox' | 'list' | 'reading' | 'folder';
  messageId: string | null;
  folderId: string | null;
}

interface UseEmailActionsProps {
  userId: Id<'admin_users'> | undefined;
  contextMenu: ContextMenuState | null;
  selectedMessageIds: Set<string>;
  selectedSubfolderId: string | null;
  messages: { _id: string }[]; // Filtered messages for current folder
  setContextMenu: (menu: ContextMenuState | null) => void;
  setSelectedMessageIds: (ids: Set<string>) => void;
  setSelectedSubfolderId: (id: string | null) => void;
  setSelectedFolder: (folder: string) => void;
  triggerManualSync: () => void;
}

export function useEmailActions({
  userId,
  contextMenu,
  selectedMessageIds,
  selectedSubfolderId,
  messages,
  setContextMenu,
  setSelectedMessageIds,
  setSelectedSubfolderId,
  setSelectedFolder,
  triggerManualSync,
}: UseEmailActionsProps) {
  // Email actions from Convex
  const deleteMessage = useAction(api.productivity.email.outlookActions.deleteOutlookMessage);
  const permanentlyDeleteMessage = useAction(api.productivity.email.outlookPermanentDelete.permanentlyDeleteOutlookMessage);
  const archiveMessage = useAction(api.productivity.email.outlookActions.archiveOutlookMessage);
  const deleteFolder = useAction(api.productivity.email.outlookFolderActions.deleteOutlookFolder);
  const batchSyncReadStatus = useAction(api.productivity.email.outlookActions.batchMarkOutlookReadStatus);
  const batchConvexReadStatus = useMutation(api.productivity.email.outlookActions.batchUpdateMessageReadStatus);
  const reconcileReadStatus = useAction(api.productivity.email.outlookReconcile.reconcileReadStatus);

  // FUSE actions for instant UI update (no round-trip)
  const batchUpdateEmailReadStatus = useFuse((state) => state.batchUpdateEmailReadStatus);
  const batchClearPendingReadUpdates = useFuse((state) => state.batchClearPendingReadUpdates);
  const removeEmailMessages = useFuse((state) => state.removeEmailMessages);
  const removeEmailFolder = useFuse((state) => state.removeEmailFolder);
  const clearBodiesForMessages = useFuse((state) => state.clearBodiesForMessages);

  const handleContextAction = useCallback(async (action: string) => {
    const currentContextMenu = contextMenu;
    setContextMenu(null);

    if (action === 'refresh') {
      triggerManualSync();
      return;
    }

    if (action === 'selectAll') {
      // Select all messages in current folder
      const allIds = new Set(messages.map(m => m._id));
      setSelectedMessageIds(allIds);
      console.log(`✅ Selected all ${allIds.size} messages`);
      return;
    }

    if (action === 'deleteFolder') {
      if (!userId) {
        console.error('❌ Cannot delete folder: No user ID');
        return;
      }
      if (!currentContextMenu?.folderId) {
        console.error('❌ Cannot delete folder: No folder ID');
        return;
      }

      const folderId = currentContextMenu.folderId;
      console.log(`🗑️ Deleting folder...`);

      // 1. INSTANT UI: Remove folder from FUSE immediately
      removeEmailFolder(folderId);
      if (selectedSubfolderId === folderId) {
        setSelectedSubfolderId(null);
        setSelectedFolder('inbox');
      }

      // 2. BACKGROUND: Fire API call (fire-and-forget)
      deleteFolder({
        userId,
        folderId: folderId as Id<'productivity_email_Folders'>,
      }).then((result) => {
        if (result.success) {
          console.log(`✅ Folder deleted from server`);
        } else {
          console.error(`❌ Failed to delete folder:`, result.error);
        }
      }).catch((error) => {
        console.error(`❌ Error deleting folder:`, error);
      });
      return;
    }

    if (action === 'delete') {
      if (!userId) {
        console.error('❌ Cannot delete: No user ID');
        return;
      }

      const messageIdsToDelete = [...selectedMessageIds];
      console.log(`🗑️ Deleting ${messageIdsToDelete.length} message(s)...`);
      sounds.trash();

      for (const messageId of messageIdsToDelete) {
        try {
          const result = await deleteMessage({
            userId,
            messageId: messageId as Id<'productivity_email_Index'>,
          });

          if (result.success) {
            console.log(`✅ Deleted message ${messageId}`);
          } else {
            console.error(`❌ Failed to delete ${messageId}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error deleting ${messageId}:`, error);
        }
      }

      setSelectedMessageIds(new Set());
      return;
    }

    if (action === 'deleteForever') {
      if (!userId) {
        console.error('❌ Cannot permanently delete: No user ID');
        return;
      }

      const messageIdsToDelete = [...selectedMessageIds];
      console.log(`🗑️ Permanently deleting ${messageIdsToDelete.length} message(s)...`);

      // 1. INSTANT UI: Remove from FUSE immediately
      removeEmailMessages(messageIdsToDelete);
      clearBodiesForMessages(messageIdsToDelete);
      setSelectedMessageIds(new Set());
      sounds.trash();

      // 2. BACKGROUND: Fire API calls (fire-and-forget)
      for (const messageId of messageIdsToDelete) {
        permanentlyDeleteMessage({
          userId,
          messageId: messageId as Id<'productivity_email_Index'>,
        }).then((result) => {
          if (result.success) {
            console.log(`✅ Permanently deleted ${messageId.slice(-8)}`);
          } else {
            console.error(`❌ Failed to permanently delete ${messageId.slice(-8)}:`, result.error);
          }
        }).catch((error) => {
          console.error(`❌ Error permanently deleting ${messageId.slice(-8)}:`, error);
        });
      }
      return;
    }

    if (action === 'emptyFolder') {
      if (!userId) {
        console.error('❌ Cannot empty folder: No user ID');
        return;
      }

      // Get all messages in current folder
      const messageIdsToDelete = messages.map(m => m._id);
      console.log(`🗑️ Permanently deleting all ${messageIdsToDelete.length} message(s) in folder...`);

      // 1. INSTANT UI: Remove from FUSE immediately
      removeEmailMessages(messageIdsToDelete);
      clearBodiesForMessages(messageIdsToDelete);
      setSelectedMessageIds(new Set());
      sounds.trash();

      // 2. BACKGROUND: Fire API calls (fire-and-forget)
      for (const messageId of messageIdsToDelete) {
        permanentlyDeleteMessage({
          userId,
          messageId: messageId as Id<'productivity_email_Index'>,
        }).then((result) => {
          if (result.success) {
            console.log(`✅ Permanently deleted ${messageId.slice(-8)}`);
          } else {
            console.error(`❌ Failed to permanently delete ${messageId.slice(-8)}:`, result.error);
          }
        }).catch((error) => {
          console.error(`❌ Error permanently deleting ${messageId.slice(-8)}:`, error);
        });
      }
      return;
    }

    if (action === 'archive') {
      if (!userId) {
        console.error('❌ Cannot archive: No user ID');
        return;
      }

      const messageIdsToArchive = [...selectedMessageIds];
      console.log(`📁 Archiving ${messageIdsToArchive.length} message(s)...`);

      for (const messageId of messageIdsToArchive) {
        try {
          const result = await archiveMessage({
            userId,
            messageId: messageId as Id<'productivity_email_Index'>,
          });

          if (result.success) {
            console.log(`✅ Archived message ${messageId}`);
          } else {
            console.error(`❌ Failed to archive ${messageId}:`, result.error);
          }
        } catch (error) {
          console.error(`❌ Error archiving ${messageId}:`, error);
        }
      }

      setSelectedMessageIds(new Set());
      return;
    }

    if (action === 'markRead' || action === 'markUnread') {
      console.log(`📧 Mark action triggered:`, { action, userId, selectedCount: selectedMessageIds.size });

      if (!userId) {
        console.error('❌ Cannot mark read/unread: No user ID');
        return;
      }

      const isRead = action === 'markRead';
      const messageIdsToUpdate = [...selectedMessageIds];

      if (messageIdsToUpdate.length === 0) {
        console.error('❌ Cannot mark read/unread: No messages selected');
        return;
      }

      console.log(`📧 Mark ${isRead ? 'READ' : 'UNREAD'}: ${messageIdsToUpdate.length} messages`);

      // 1. INSTANT UI: Single FUSE update for ALL messages (scales to 1000+)
      batchUpdateEmailReadStatus(messageIdsToUpdate, isRead);

      // 2. SINGLE Convex mutation for ALL messages (no N+1 queries)
      try {
        await batchConvexReadStatus({
          userId,
          messageIds: messageIdsToUpdate as Id<'productivity_email_Index'>[],
          isRead,
        });
      } catch (error) {
        console.error(`❌ Batch Convex update failed:`, error);
      }

      // 3. Clear pending flags after protection window (10s for Convex live query catch-up)
      setTimeout(() => batchClearPendingReadUpdates(messageIdsToUpdate), 10000);

      // 4. BACKGROUND: Outlook sync with retry
      // - Retries up to 3 times with exponential backoff
      // - WebSocket disconnects trigger retry
      // - Rate limiting triggers delayed reconciliation
      const syncToOutlook = async (attempt = 1): Promise<void> => {
        if (!navigator.onLine) {
          console.log(`📡 Outlook sync deferred (offline), will retry when online`);
          // Wait for online event, then retry
          const onOnline = () => {
            window.removeEventListener('online', onOnline);
            syncToOutlook(attempt);
          };
          window.addEventListener('online', onOnline);
          return;
        }

        try {
          const result = await batchSyncReadStatus({
            userId,
            messageIds: messageIdsToUpdate as Id<'productivity_email_Index'>[],
            isRead,
          });

          if (result.failed > 0) {
            console.log(`📡 Outlook: ${result.processed} ok, ${result.failed} failed, ${result.skipped} skipped`);
          } else {
            console.log(`📡 Outlook: ${result.processed} synced`);
          }

          // Rate limiting detected - queue reconciliation in 2 minutes
          // Deduplication: accumulate IDs, reset timer, run ONE reconciliation after dust settles
          if (result.hadRateLimiting) {
            // Add these IDs to the pending set
            messageIdsToUpdate.forEach(id => pendingReconcileIds.add(id));

            // Clear existing timer (we'll start a fresh 2-min countdown)
            if (pendingReconcileTimer) {
              clearTimeout(pendingReconcileTimer);
            }

            const pendingCount = pendingReconcileIds.size;
            console.log(`⚠️ Rate limiting detected - reconciliation queued in 2 minutes (${pendingCount} messages pending)`);

            // Capture userId for the closure
            const capturedUserId = userId!;

            pendingReconcileTimer = setTimeout(() => {
              // Grab all accumulated IDs and clear the set
              const idsToReconcile = [...pendingReconcileIds];
              pendingReconcileIds = new Set();
              pendingReconcileTimer = null;

              console.log(`🔄 Running scheduled reconciliation for ${idsToReconcile.length} messages`);
              reconcileReadStatus({
                userId: capturedUserId,
                messageIds: idsToReconcile as Id<'productivity_email_Index'>[],
              }).then((reconcileResult) => {
                console.log(`🔄 Reconciliation: ${reconcileResult.reconciled} ok, ${reconcileResult.failed} failed`);
              }).catch((error) => {
                console.error(`🔄 Reconciliation failed:`, error);
              });
            }, 2 * 60 * 1000); // 2 minutes
          }
        } catch (error) {
          // Retry with exponential backoff (1s, 2s, 4s)
          if (attempt < 3) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`📡 Outlook sync failed (attempt ${attempt}/3), retrying in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            return syncToOutlook(attempt + 1);
          }
          console.error(`📡 Outlook sync failed after 3 attempts:`, error);
        }
      };

      // Fire-and-forget with retry
      syncToOutlook();

      return;
    }

    // Other actions are still stubbed
    console.log(`Context action: ${action}`, {
      selectedCount: selectedMessageIds.size,
      messageIds: [...selectedMessageIds],
    });
  }, [
    contextMenu,
    userId,
    selectedMessageIds,
    selectedSubfolderId,
    messages,
    setContextMenu,
    setSelectedMessageIds,
    setSelectedSubfolderId,
    setSelectedFolder,
    triggerManualSync,
    deleteMessage,
    permanentlyDeleteMessage,
    archiveMessage,
    deleteFolder,
    batchUpdateEmailReadStatus,
    batchClearPendingReadUpdates,
    removeEmailMessages,
    removeEmailFolder,
    clearBodiesForMessages,
    batchConvexReadStatus,
    batchSyncReadStatus,
    reconcileReadStatus,
  ]);

  return { handleContextAction };
}
