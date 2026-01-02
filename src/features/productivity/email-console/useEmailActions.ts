'use client';

import { useCallback } from 'react';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';

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
  setContextMenu,
  setSelectedMessageIds,
  setSelectedSubfolderId,
  setSelectedFolder,
  triggerManualSync,
}: UseEmailActionsProps) {
  // Email actions from Convex
  const deleteMessage = useAction(api.productivity.email.outlookActions.deleteOutlookMessage);
  const archiveMessage = useAction(api.productivity.email.outlookActions.archiveOutlookMessage);
  const deleteFolder = useAction(api.productivity.email.outlookFolderActions.deleteOutlookFolder);
  const batchSyncReadStatus = useAction(api.productivity.email.outlookActions.batchMarkOutlookReadStatus);
  const updateConvexReadStatus = useMutation(api.productivity.email.outlookActions.updateMessageReadStatus);

  // FUSE actions for instant UI update (no round-trip)
  const updateEmailReadStatus = useFuse((state) => state.updateEmailReadStatus);
  const clearPendingReadUpdate = useFuse((state) => state.clearPendingReadUpdate);

  const handleContextAction = useCallback(async (action: string) => {
    const currentContextMenu = contextMenu;
    setContextMenu(null);

    if (action === 'refresh') {
      triggerManualSync();
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

      console.log(`🗑️ Deleting folder...`);

      try {
        const result = await deleteFolder({
          userId,
          folderId: currentContextMenu.folderId as Id<'productivity_email_Folders'>,
        });

        if (result.success) {
          console.log(`✅ Folder deleted`);
          if (selectedSubfolderId) {
            setSelectedSubfolderId(null);
            setSelectedFolder('inbox');
          }
        } else {
          console.error(`❌ Failed to delete folder:`, result.error);
          alert(`Failed to delete folder: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Error deleting folder:`, error);
        alert(`Error deleting folder: ${error}`);
      }
      return;
    }

    if (action === 'delete') {
      if (!userId) {
        console.error('❌ Cannot delete: No user ID');
        return;
      }

      const messageIdsToDelete = [...selectedMessageIds];
      console.log(`🗑️ Deleting ${messageIdsToDelete.length} message(s)...`);

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

      console.log(`📧 Mark ${isRead ? 'READ' : 'UNREAD'}: ${messageIdsToUpdate.length} messages`, messageIdsToUpdate);

      // INSTANT UI: Update FUSE store directly (no round-trip)
      for (const messageId of messageIdsToUpdate) {
        updateEmailReadStatus(messageId, isRead);
      }

      // Update Convex DB and clear pending flag when done
      await Promise.all(
        messageIdsToUpdate.map(async (messageId) => {
          try {
            await updateConvexReadStatus({
              userId,
              messageId: messageId as Id<'productivity_email_Index'>,
              isRead,
            });
          } catch (error) {
            console.error(`❌ Convex update failed:`, error);
          } finally {
            // Delay clearing pending to give sync time to see the protection
            // The CONVEX_LIVE sync runs immediately on mutation, so we need buffer
            setTimeout(() => clearPendingReadUpdate(messageId), 500);
          }
        })
      );

      // BACKGROUND: Batch sync to Outlook API (20 messages per request, avoids throttling)
      batchSyncReadStatus({
        userId,
        messageIds: messageIdsToUpdate as Id<'productivity_email_Index'>[],
        isRead,
      }).then((result) => {
        if (result.failed > 0) {
          console.warn(`⚠️ Outlook batch sync: ${result.processed} success, ${result.failed} failed`);
        } else {
          console.log(`✅ Outlook batch sync: ${result.processed} messages synced`);
        }
      }).catch((error) => console.error(`❌ Outlook batch sync failed:`, error));

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
    setContextMenu,
    setSelectedMessageIds,
    setSelectedSubfolderId,
    setSelectedFolder,
    triggerManualSync,
    deleteMessage,
    archiveMessage,
    deleteFolder,
    updateEmailReadStatus,
    clearPendingReadUpdate,
    updateConvexReadStatus,
    batchSyncReadStatus,
  ]);

  return { handleContextAction };
}
