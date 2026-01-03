'use client';

import { useEffect, useRef } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  area: 'mailbox' | 'list' | 'reading' | 'folder';
  messageId: string | null;
  folderId: string | null;
}

interface EmailContextMenuProps {
  contextMenu: ContextMenuState;
  selectedMessageIds: Set<string>;
  onClose: () => void;
  onAction: (action: string) => void;
}

export function EmailContextMenu({
  contextMenu,
  selectedMessageIds,
  onClose,
  onAction,
}: EmailContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Native event listener for extra reliability - React synthetic events
  // can sometimes have timing issues with context menu prevention
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    menu.addEventListener('contextmenu', preventContextMenu, true);
    return () => menu.removeEventListener('contextmenu', preventContextMenu, true);
  }, []);

  return (
    <>
      <div
        className="ft-email__context-backdrop"
        onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onClose(); }}
      />
      <div
        ref={menuRef}
        className="ft-email__context-menu"
        style={{ '--ctx-x': `${contextMenu.x}px`, '--ctx-y': `${contextMenu.y}px` } as React.CSSProperties}
        onContextMenuCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
      >
        {/* MAILBOX SIDEBAR - folder actions */}
        {contextMenu.area === 'mailbox' && (
          <>
            <button onClick={() => onAction('newFolder')}>New Folder</button>
            <button onClick={() => onAction('markAllRead')}>Mark All as Read</button>
            <hr />
            <button onClick={() => onAction('refresh')}>Refresh</button>
            <button onClick={() => onAction('resetLayout')}>Reset Layout</button>
          </>
        )}

        {/* FOLDER - individual folder actions */}
        {contextMenu.area === 'folder' && contextMenu.folderId && (
          <>
            <button onClick={() => onAction('openFolder')}>Open</button>
            <button onClick={() => onAction('markAllRead')}>Mark All as Read</button>
            <hr />
            <button onClick={() => onAction('deleteFolder')}>Delete</button>
          </>
        )}

        {/* MESSAGE LIST - email actions */}
        {contextMenu.area === 'list' && (contextMenu.messageId || selectedMessageIds.size > 0) && (
          <>
            <button onClick={() => onAction('open')}>Open</button>
            <hr />
            <button onClick={() => onAction('selectAll')}>Select All</button>
            <hr />
            <button onClick={() => onAction('reply')}>Reply</button>
            <button onClick={() => onAction('replyAll')}>Reply All</button>
            <button onClick={() => onAction('forward')}>Forward</button>
            <hr />
            <button onClick={() => onAction('markRead')}>Mark as Read</button>
            <button onClick={() => onAction('markUnread')}>Mark as Unread</button>
            <hr />
            <button onClick={() => onAction('archive')}>Archive</button>
            <button onClick={() => onAction('delete')}>Delete</button>
          </>
        )}

        {/* MESSAGE LIST - empty area (no message selected) */}
        {contextMenu.area === 'list' && !contextMenu.messageId && selectedMessageIds.size === 0 && (
          <>
            <button onClick={() => onAction('newEmail')}>New Email</button>
            <button onClick={() => onAction('selectAll')}>Select All</button>
            <hr />
            <button onClick={() => onAction('refresh')}>Refresh</button>
          </>
        )}

        {/* READING PANE - content actions */}
        {contextMenu.area === 'reading' && (
          <>
            <button onClick={() => onAction('reply')}>Reply</button>
            <button onClick={() => onAction('replyAll')}>Reply All</button>
            <button onClick={() => onAction('forward')}>Forward</button>
            <hr />
            <button onClick={() => onAction('print')}>Print</button>
            <hr />
            <button onClick={() => onAction('delete')}>Delete</button>
          </>
        )}
      </div>
    </>
  );
}
