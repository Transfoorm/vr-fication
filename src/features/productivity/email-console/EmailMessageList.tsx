'use client';

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { T, Icon } from '@/vr';
import { formatThreadDate } from './utils';
import type { EmailMessage, EmailFolder } from './types';

// Virtual item types
type VirtualItem =
  | { type: 'header'; bucket: string }
  | { type: 'message'; message: EmailMessage; bucket: string };

interface EmailMessageListProps {
  selectedFolder: string;
  selectedSubfolderId: string | null;
  allFolders: EmailFolder[];
  messages: EmailMessage[];
  isSyncing: boolean;
  isHydrated: boolean;
  selectedMessageIds: Set<string>;
  virtualItems: VirtualItem[];
  collapsedSections: Set<string>;
  isKeyboardNav: boolean;
  onToggleSection: (bucket: string) => void;
  onMessageClick: (messageId: string, event: React.MouseEvent) => void;
  onMessageContextMenu: (messageId: string, event: React.MouseEvent) => void;
  onListContextMenu: (event: React.MouseEvent) => void;
  onRefresh: () => void;
  onMouseMove: () => void;
  onVisibleIdsChange: (ids: string[]) => void;
}

export function EmailMessageList({
  selectedFolder,
  selectedSubfolderId,
  allFolders,
  messages,
  isSyncing,
  isHydrated,
  selectedMessageIds,
  virtualItems,
  collapsedSections,
  isKeyboardNav,
  onToggleSection,
  onMessageClick,
  onMessageContextMenu,
  onListContextMenu,
  onRefresh,
  onMouseMove,
  onVisibleIdsChange,
}: EmailMessageListProps) {
  // Own scroll container ref and virtualizer
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevVisibleIdsRef = useRef<string>('');

  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => virtualItems[index].type === 'header' ? 32 : 72,
    overscan: 5,
  });

  // Extract visible message IDs for prefetch
  const visibleRows = virtualizer.getVirtualItems();
  const visibleIds = visibleRows
    .map((row) => virtualItems[row.index])
    .filter((item): item is { type: 'message'; message: EmailMessage; bucket: string } =>
      item.type === 'message'
    )
    .map((item) => item.message._id);

  // Report visible IDs to parent (only when they change)
  useEffect(() => {
    const key = visibleIds.join(',');
    if (key !== prevVisibleIdsRef.current) {
      prevVisibleIdsRef.current = key;
      onVisibleIdsChange(visibleIds);
    }
  }, [visibleIds, onVisibleIdsChange]);

  return (
    <section
      className={`ft-email__threads${isKeyboardNav ? ' ft-email__threads--keyboard-nav' : ''}`}
      onContextMenu={onListContextMenu}
      onMouseMove={onMouseMove}
    >
      {/* Folder title header */}
      <div className="ft-email__threads-header">
        <span className="ft-email__threads-title">
          {selectedFolder === 'inbox' && 'Inbox'}
          {selectedFolder === 'sent' && 'Sent'}
          {selectedFolder === 'drafts' && 'Drafts'}
          {selectedFolder === 'archive' && 'Archive'}
          {selectedFolder === 'trash' && 'Deleted'}
          {selectedFolder === 'spam' && 'Junk'}
          {selectedFolder === 'custom' && (allFolders.find(f => f.externalFolderId === selectedSubfolderId)?.displayName || 'Custom')}
          {selectedFolder !== 'custom' && selectedSubfolderId && ` / ${allFolders.find(f => f.externalFolderId === selectedSubfolderId)?.displayName || ''}`}
        </span>
        <span className="ft-email__threads-count">
          {messages.length} item{messages.length !== 1 ? 's' : ''}
          {isSyncing
            ? ' · Syncing...'
            : selectedMessageIds.size > 1 && ` · ${selectedMessageIds.size} selected`}
        </span>
        <button
          className={`ft-email__refresh-btn${isSyncing ? ' ft-email__refresh-btn--syncing' : ''}`}
          onClick={onRefresh}
          disabled={isSyncing}
          title={isSyncing ? 'Syncing...' : 'Send and receive all items'}
        >
          <Icon variant="refresh" size="xs" strokeWidth={1.5} />
        </button>
      </div>
      <div className="ft-email__threads-scroll" ref={scrollContainerRef}>
        {!isHydrated ? (
          <div className="ft-email__loading"><T.body color="secondary">Loading...</T.body></div>
        ) : messages.length === 0 ? (
          <div className="ft-email__empty"><T.body color="secondary">No emails yet</T.body></div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const item = virtualItems[virtualRow.index];

              if (item.type === 'header') {
                const isCollapsed = collapsedSections.has(item.bucket);
                return (
                  <div
                    key={`header-${item.bucket}`}
                    className="ft-email__section-header"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    onClick={() => onToggleSection(item.bucket)}
                  >
                    <span>{item.bucket}</span>
                    <span className={`ft-email__section-chevron ${isCollapsed ? 'ft-email__section-chevron--collapsed' : ''}`}>
                      ›
                    </span>
                  </div>
                );
              }

              const message = item.message;
              return (
                <div
                  key={message._id}
                  data-message-id={message._id}
                  className={`ft-email__thread-item ${selectedMessageIds.has(message._id) ? 'ft-email__thread-item--selected' : ''} ${!message.isRead ? 'ft-email__thread-item--unread' : ''}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  onClick={(e) => onMessageClick(message._id, e)}
                  onContextMenu={(e) => onMessageContextMenu(message._id, e)}
                >
                  <div className="ft-email__thread-top">
                    <div className="ft-email__thread-sender">
                      {message.from.name || message.from.email || 'Unknown'}
                    </div>
                    <div className="ft-email__thread-date">
                      {formatThreadDate(message.receivedAt)}
                    </div>
                  </div>
                  <div className="ft-email__thread-subject">{message.subject}</div>
                  <div className="ft-email__thread-snippet">{message.snippet || ''}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
