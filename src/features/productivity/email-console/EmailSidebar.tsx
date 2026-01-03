'use client';

import { SubfolderTree } from './SubfolderTree';
import type { EmailFolder } from './types';

interface EmailSidebarProps {
  selectedFolder: string;
  selectedSubfolderId: string | null;
  expandedFolders: Set<string>;
  folderTree: Record<string, EmailFolder[]>;
  folderCounts: Record<string, number>;
  subfolderCounts: Record<string, number>;
  contextMenuFolderId: string | null;
  getChildFolders: (parentId: string) => EmailFolder[];
  onFolderSelect: (folder: string) => void;
  onSubfolderSelect: (subfolder: EmailFolder) => void;
  onToggleFolderExpand: (key: string) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onFolderContextMenu: (folderId: string, event: React.MouseEvent) => void;
  onCustomFolderSelect: (folderId: string) => void;
}

export function EmailSidebar({
  selectedFolder,
  selectedSubfolderId,
  expandedFolders,
  folderTree,
  folderCounts,
  subfolderCounts,
  contextMenuFolderId,
  getChildFolders,
  onFolderSelect,
  onSubfolderSelect,
  onToggleFolderExpand,
  onContextMenu,
  onFolderContextMenu,
  onCustomFolderSelect,
}: EmailSidebarProps) {
  return (
    <aside className="ft-email__mailbox" onContextMenu={onContextMenu}>
      {/* Inbox with expandable subfolders */}
      <div className="ft-email__folder-group">
        <div
          className={`ft-email__folder ${selectedFolder === 'inbox' ? 'ft-email__folder--selected' : ''} ${selectedFolder === 'inbox' && selectedSubfolderId ? 'ft-email__folder--child-selected' : ''}`}
          onClick={() => onFolderSelect('inbox')}
        >
          {folderTree.inbox.length > 0 && (
            <span
              className={`ft-email__folder-chevron ${expandedFolders.has('inbox') ? 'ft-email__folder-chevron--expanded' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFolderExpand('inbox'); }}
            >
              ›
            </span>
          )}
          <span className="ft-email__folder-icon">📥</span>
          <span className="ft-email__folder-label">Inbox</span>
          {folderCounts.inbox > 0 && (
            <span className="ft-email__folder-count">{folderCounts.inbox}</span>
          )}
        </div>
        {expandedFolders.has('inbox') && folderTree.inbox.length > 0 && (
          <SubfolderTree
            folders={folderTree.inbox}
            getChildFolders={getChildFolders}
            selectedSubfolderId={selectedSubfolderId}
            expandedFolders={expandedFolders}
            toggleFolderExpand={onToggleFolderExpand}
            onSelect={onSubfolderSelect}
            onContextMenu={onFolderContextMenu}
            contextMenuFolderId={contextMenuFolderId}
            unreadCounts={subfolderCounts}
          />
        )}
      </div>

      {/* Drafts */}
      <div
        className={`ft-email__folder ${selectedFolder === 'drafts' ? 'ft-email__folder--selected' : ''}`}
        onClick={() => onFolderSelect('drafts')}
      >
        <span className="ft-email__folder-icon ft-email__folder-icon--flipped">✏️</span>
        <span className="ft-email__folder-label">Drafts</span>
        {folderCounts.drafts > 0 && (
          <span className="ft-email__folder-count">{folderCounts.drafts}</span>
        )}
      </div>

      {/* Sent */}
      <div
        className={`ft-email__folder ${selectedFolder === 'sent' ? 'ft-email__folder--selected' : ''}`}
        onClick={() => onFolderSelect('sent')}
      >
        <span className="ft-email__folder-icon">📩</span>
        <span className="ft-email__folder-label">Sent</span>
        {folderCounts.sent > 0 && (
          <span className="ft-email__folder-count">{folderCounts.sent}</span>
        )}
      </div>

      {/* Archive with expandable subfolders */}
      <div className="ft-email__folder-group">
        <div
          className={`ft-email__folder ${selectedFolder === 'archive' ? 'ft-email__folder--selected' : ''} ${selectedFolder === 'archive' && selectedSubfolderId ? 'ft-email__folder--child-selected' : ''}`}
          onClick={() => onFolderSelect('archive')}
        >
          {folderTree.archive.length > 0 && (
            <span
              className={`ft-email__folder-chevron ${expandedFolders.has('archive') ? 'ft-email__folder-chevron--expanded' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFolderExpand('archive'); }}
            >
              ›
            </span>
          )}
          <span className="ft-email__folder-icon">🔎</span>
          <span className="ft-email__folder-label">Archive</span>
          {folderCounts.archive > 0 && (
            <span className="ft-email__folder-count">{folderCounts.archive}</span>
          )}
        </div>
        {expandedFolders.has('archive') && folderTree.archive.length > 0 && (
          <SubfolderTree
            folders={folderTree.archive}
            getChildFolders={getChildFolders}
            selectedSubfolderId={selectedSubfolderId}
            expandedFolders={expandedFolders}
            toggleFolderExpand={onToggleFolderExpand}
            onSelect={onSubfolderSelect}
            onContextMenu={onFolderContextMenu}
            contextMenuFolderId={contextMenuFolderId}
            unreadCounts={subfolderCounts}
          />
        )}
      </div>

      {/* Deleted with expandable subfolders */}
      <div className="ft-email__folder-group">
        <div
          className={`ft-email__folder ${selectedFolder === 'trash' ? 'ft-email__folder--selected' : ''} ${selectedFolder === 'trash' && selectedSubfolderId ? 'ft-email__folder--child-selected' : ''}`}
          onClick={() => onFolderSelect('trash')}
        >
          {folderTree.trash.length > 0 && (
            <span
              className={`ft-email__folder-chevron ${expandedFolders.has('trash') ? 'ft-email__folder-chevron--expanded' : ''}`}
              onClick={(e) => { e.stopPropagation(); onToggleFolderExpand('trash'); }}
            >
              ›
            </span>
          )}
          <span className="ft-email__folder-icon ft-email__folder-icon--trash">🗑️</span>
          <span className="ft-email__folder-label">Deleted</span>
          {folderCounts.trash > 0 && (
            <span className="ft-email__folder-count">{folderCounts.trash}</span>
          )}
        </div>
        {expandedFolders.has('trash') && folderTree.trash.length > 0 && (
          <SubfolderTree
            folders={folderTree.trash}
            getChildFolders={getChildFolders}
            selectedSubfolderId={selectedSubfolderId}
            expandedFolders={expandedFolders}
            toggleFolderExpand={onToggleFolderExpand}
            onSelect={onSubfolderSelect}
            onContextMenu={onFolderContextMenu}
            contextMenuFolderId={contextMenuFolderId}
            unreadCounts={subfolderCounts}
          />
        )}
      </div>

      {/* Junk */}
      <div
        className={`ft-email__folder ${selectedFolder === 'spam' ? 'ft-email__folder--selected' : ''}`}
        onClick={() => onFolderSelect('spam')}
      >
        <span className="ft-email__folder-icon ft-email__folder-icon--junk">🚫</span>
        <span className="ft-email__folder-label">Junk</span>
        {folderCounts.spam > 0 && (
          <span className="ft-email__folder-count">{folderCounts.spam}</span>
        )}
      </div>

      {/* Custom Folders (e.g., Fyxer AI) */}
      {folderTree.custom.length > 0 && (
        <>
          <div className="ft-email__folder-divider" />
          {folderTree.custom.map((folder) => {
            const unreadCount = subfolderCounts[folder.externalFolderId] || 0;
            return (
              <div
                key={folder._id}
                className={`ft-email__folder ${selectedFolder === 'custom' && selectedSubfolderId === folder.externalFolderId ? 'ft-email__folder--selected' : ''}`}
                onClick={() => onCustomFolderSelect(folder.externalFolderId)}
                onContextMenu={(e) => onFolderContextMenu(folder._id, e)}
                title={folder.displayName}
              >
                <span className="ft-email__folder-icon">📁</span>
                <span className="ft-email__folder-label">{folder.displayName}</span>
                {unreadCount > 0 && (
                  <span className="ft-email__folder-count">{unreadCount}</span>
                )}
              </div>
            );
          })}
        </>
      )}
    </aside>
  );
}
