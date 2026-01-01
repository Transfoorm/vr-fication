'use client';

import type { EmailFolder } from './types';

interface SubfolderTreeProps {
  folders: EmailFolder[];
  getChildFolders: (parentId: string) => EmailFolder[];
  selectedSubfolderId: string | null;
  expandedFolders: Set<string>;
  toggleFolderExpand: (key: string) => void;
  onSelect: (folder: EmailFolder) => void;
  onContextMenu?: (folderId: string, event: React.MouseEvent) => void;
  contextMenuFolderId?: string | null;
  unreadCounts?: Record<string, number>;
  depth?: number;
}

export function SubfolderTree({
  folders,
  getChildFolders,
  selectedSubfolderId,
  expandedFolders,
  toggleFolderExpand,
  onSelect,
  onContextMenu,
  contextMenuFolderId,
  unreadCounts,
  depth = 0,
}: SubfolderTreeProps) {
  // Practical ceiling (1M) - accommodates anything Microsoft allows
  if (depth > 1000000) return null;

  return (
    <div className="ft-email__subfolders">
      {folders.map((folder) => {
        const children = getChildFolders(folder.externalFolderId);
        const hasChildren = children.length > 0;
        const expandKey = `sub:${folder.externalFolderId}`;
        const isExpanded = expandedFolders.has(expandKey);

        const isContextActive = contextMenuFolderId === folder._id;
        const unreadCount = unreadCounts?.[folder.externalFolderId] || 0;

        // Additional left padding for nested depth (keeps badges aligned to right edge)
        const depthPadding = depth > 0 ? `calc(var(--prod-space-xl) * ${depth})` : undefined;

        return (
          <div key={folder._id} className="ft-email__subfolder-group">
            <div
              className={`ft-email__subfolder ${selectedSubfolderId === folder.externalFolderId ? 'ft-email__subfolder--selected' : ''} ${isContextActive ? 'ft-email__subfolder--context-active' : ''}`}
              style={depthPadding ? { paddingLeft: `calc(var(--prod-space-3xl) + ${depthPadding})` } : undefined}
              title={folder.displayName}
              onClick={() => onSelect(folder)}
              onContextMenu={onContextMenu ? (e) => onContextMenu(folder._id, e) : undefined}
            >
              {hasChildren && (
                <span
                  className={`ft-email__folder-chevron ${isExpanded ? 'ft-email__folder-chevron--expanded' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpand(expandKey); }}
                >
                  ›
                </span>
              )}
              <span className="ft-email__subfolder-icon">📁</span>
              <span className="ft-email__subfolder-label">{folder.displayName}</span>
              {unreadCount > 0 && (
                <span className="ft-email__subfolder-count">{unreadCount}</span>
              )}
            </div>
            {/* Recursive children */}
            {hasChildren && isExpanded && (
              <SubfolderTree
                folders={children}
                getChildFolders={getChildFolders}
                selectedSubfolderId={selectedSubfolderId}
                expandedFolders={expandedFolders}
                toggleFolderExpand={toggleFolderExpand}
                onSelect={onSelect}
                onContextMenu={onContextMenu}
                contextMenuFolderId={contextMenuFolderId}
                unreadCounts={unreadCounts}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
