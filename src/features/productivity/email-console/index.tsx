'use client';

/**──────────────────────────────────────────────────────────────────────┐
│  EMAIL CONSOLE - Live Mode (Outlook Web Clone)                       │
│  /src/features/productivity/email-console/index.tsx                  │
│                                                                       │
│  WIREFRAME STAGE - Structure only, no styling                        │
│  TTTS-2 COMPLIANT: Pure FUSE reader (Golden Bridge pattern)          │
│                                                                       │
│  Layout:                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ HEADER                                                          │ │
│  ├───────────┬─────────────────────┬───────────────────────────────┤ │
│  │ MAILBOX   │ MESSAGE LIST        │ READING PANE                  │ │
│  └───────────┴─────────────────────┴───────────────────────────────┘ │
│                                                                       │
│  Individual message view (not conversation threads)                  │
└───────────────────────────────────────────────────────────────────────*/

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useProductivityData } from '@/hooks/useProductivityData';
import { useEmailSyncIntent } from '@/hooks/useEmailSyncIntent';
import { useFuse } from '@/store/fuse';
import { T, Icon } from '@/vr';
import { MessageBody } from './MessageBody';
import type { Id } from '@/convex/_generated/dataModel';
import { getTimeBucket, formatThreadDate, getSavedWidth, STORAGE_KEY_MAILBOX, STORAGE_KEY_THREADS, STANDARD_FOLDERS } from './utils';
import './email-console.css';
import './email-normalize.css'; // Gmail/Outlook-style email body normalization

// Types for folder rendering
type FolderItem = {
  _id: string;
  externalFolderId: string;
  displayName: string;
  canonicalFolder: string;
  parentFolderId?: string;
  childFolderCount: number;
  provider: 'outlook' | 'gmail';
};

// Recursive Subfolder Component
function SubfolderTree({
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
}: {
  folders: FolderItem[];
  getChildFolders: (parentId: string) => FolderItem[];
  selectedSubfolderId: string | null;
  expandedFolders: Set<string>;
  toggleFolderExpand: (key: string) => void;
  onSelect: (folder: FolderItem) => void;
  onContextMenu?: (folderId: string, event: React.MouseEvent) => void;
  contextMenuFolderId?: string | null;
  unreadCounts?: Record<string, number>;
  depth?: number;
}) {
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


export function EmailConsole() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Column widths - initialized from localStorage, persisted on resize
  const [mailboxWidth, setMailboxWidth] = useState(() => getSavedWidth(STORAGE_KEY_MAILBOX, 180));
  const [threadsWidth, setThreadsWidth] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(STORAGE_KEY_THREADS);
    return saved ? parseInt(saved, 10) : null;
  });

  // Get data from FUSE (Golden Bridge pattern)
  const { data, flags } = useProductivityData();

  // Get user's Convex ID for actions
  const user = useFuse((state) => state.user);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

  // Email actions
  const deleteMessage = useAction(api.productivity.email.outlookActions.deleteOutlookMessage);
  const archiveMessage = useAction(api.productivity.email.outlookActions.archiveOutlookMessage);
  const deleteFolder = useAction(api.productivity.email.outlookActions.deleteOutlookFolder);

  // Intent-based sync (triggers on focus, network, manual refresh)
  const { triggerManualSync, isSyncing } = useEmailSyncIntent();

  // Memoize arrays to prevent new references on every render
  const allMessages = useMemo(() => data.email?.messages ?? [], [data.email?.messages]);
  const rawFolders = useMemo(() => data.email?.folders ?? [], [data.email?.folders]);

  // Cache folders to prevent flicker during sync (when query briefly returns empty)
  const [cachedFolders, setCachedFolders] = useState<typeof rawFolders>([]);
  useEffect(() => {
    if (rawFolders.length > 0) {
      setCachedFolders(rawFolders);
    }
  }, [rawFolders]);
  const allFolders = rawFolders.length > 0 ? rawFolders : cachedFolders;

  // Selected folder state (canonical folder like 'inbox', 'sent', etc.)
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');

  // Selected subfolder ID (externalFolderId for filtering within a canonical folder)
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<string | null>(null);

  // Selected messages state (multi-select with Cmd/Ctrl+click) - uses _id
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // Anchor message for Shift+click range selection
  const [anchorMessageId, setAnchorMessageId] = useState<string | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    area: 'mailbox' | 'list' | 'reading' | 'folder';
    messageId: string | null;
    folderId: string | null; // For folder context menu
  } | null>(null);

  // Collapsed sections state (for thread time buckets)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Expanded folders state (for sidebar folder tree) - persisted to localStorage
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('email-expanded-folders');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Handle folder selection (canonical folder)
  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedSubfolderId(null); // Clear subfolder when selecting a top-level folder
  };

  // Handle subfolder selection
  const handleSubfolderSelect = (subfolder: typeof allFolders[0]) => {
    setSelectedFolder(subfolder.canonicalFolder); // Set parent canonical folder
    setSelectedSubfolderId(subfolder.externalFolderId); // Set specific subfolder
  };

  const toggleSection = (bucket: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(bucket)) {
        next.delete(bucket);
      } else {
        next.add(bucket);
      }
      return next;
    });
  };

  const toggleFolderExpand = (canonicalFolder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(canonicalFolder)) {
        next.delete(canonicalFolder);
      } else {
        next.add(canonicalFolder);
      }
      // Persist to localStorage
      localStorage.setItem('email-expanded-folders', JSON.stringify([...next]));
      return next;
    });
  };

  // Handle message click with multi-select support
  // - Cmd/Ctrl+click: toggle individual selection
  // - Shift+click: select range from anchor to clicked
  // - Regular click: single select (becomes new anchor)
  const handleMessageClick = (messageId: string, event: React.MouseEvent) => {
    const isModifierHeld = event.metaKey || event.ctrlKey; // Cmd (Mac) or Ctrl (PC)
    const isShiftHeld = event.shiftKey;

    if (isShiftHeld && anchorMessageId) {
      // Range select: select all between anchor and clicked
      const anchorIndex = messages.findIndex(m => m._id === anchorMessageId);
      const clickedIndex = messages.findIndex(m => m._id === messageId);

      if (anchorIndex !== -1 && clickedIndex !== -1) {
        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        const rangeIds = messages.slice(start, end + 1).map(m => m._id);
        setSelectedMessageIds(new Set(rangeIds));
      }
    } else if (isModifierHeld) {
      // Toggle selection, update anchor
      setSelectedMessageIds(prev => {
        const next = new Set(prev);
        if (next.has(messageId)) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });
      setAnchorMessageId(messageId);
    } else {
      // Single select (clear others), set as anchor
      setSelectedMessageIds(new Set([messageId]));
      setAnchorMessageId(messageId);
    }
    // Close context menu if open
    setContextMenu(null);
  };

  // Handle right-click on a message in the list
  const handleMessageContextMenu = (messageId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // If right-clicking an unselected message, select it
    if (!selectedMessageIds.has(messageId)) {
      setSelectedMessageIds(new Set([messageId]));
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      area: 'list',
      messageId,
      folderId: null,
    });
  };

  // Handle right-click on the mailbox sidebar
  const handleMailboxContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      area: 'mailbox',
      messageId: null,
      folderId: null,
    });
  };

  // Handle right-click on a folder in the sidebar
  const handleFolderContextMenu = (folderId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      area: 'folder',
      messageId: null,
      folderId,
    });
  };

  // Handle right-click on the message list area (not on a specific message)
  const handleListContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      area: 'list',
      messageId: null,
      folderId: null,
    });
  };

  // Handle right-click on the reading pane
  const handleReadingContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      area: 'reading',
      messageId: null,
      folderId: null,
    });
  };

  // Handle context menu actions
  const handleContextAction = async (action: string) => {
    const currentContextMenu = contextMenu; // Capture before clearing
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
          // Clear selection if we deleted the selected folder
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

      // Delete all selected messages
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

      // Clear selection after delete
      setSelectedMessageIds(new Set());
      return;
    }

    if (action === 'archive') {
      if (!userId) {
        console.error('❌ Cannot archive: No user ID');
        return;
      }

      // Archive all selected messages
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

      // Clear selection after archive
      setSelectedMessageIds(new Set());
      return;
    }

    // Other actions are still stubbed
    console.log(`Context action: ${action}`, {
      selectedCount: selectedMessageIds.size,
      messageIds: [...selectedMessageIds],
    });
  };

  // Build folder tree: group subfolders by their parent's canonical type
  // Also capture custom root-level folders (like Fyxer AI folders)
  // Build folder hierarchy with parent-child relationships
  const { folderTree, getChildFolders, rootFolderIds } = useMemo(() => {
    const tree: Record<string, typeof allFolders> = {
      inbox: [],
      drafts: [],
      sent: [],
      archive: [],
      spam: [],
      trash: [],
      custom: [],
    };

    // Conditional folders - only show when they have emails (like Outbox in Outlook)
    const CONDITIONAL_FOLDERS = ['clutter', 'conversation history', 'outbox'];

    // Fyxer AI numbered folder pattern: "N: name" (e.g., "1: to respond", "8: marketing")
    const FYXER_PATTERN = /^\d+:\s/;

    // Step 1: Count messages per folder (by externalFolderId)
    const folderMessageCounts = new Map<string, number>();
    for (const message of allMessages) {
      if (message.providerFolderId) {
        const count = folderMessageCounts.get(message.providerFolderId) || 0;
        folderMessageCounts.set(message.providerFolderId, count + 1);
      }
    }

    // Step 2: Find ROOT canonical folders by display name
    // The actual root folder has a recognizable display name (Inbox, Sent Items, etc.)
    // Subfolders inherit canonicalFolder from parent but have different display names
    const ROOT_DISPLAY_NAMES: Record<string, string[]> = {
      inbox: ['inbox'],
      sent: ['sent items', 'sent'],
      drafts: ['drafts'],
      archive: ['archive'],
      spam: ['junk email', 'junk', 'spam'],
      trash: ['deleted items', 'deleted', 'trash'],
    };

    const rootFolderIds: Record<string, string> = {};
    for (const folder of allFolders) {
      const canonical = folder.canonicalFolder || '';
      const displayLower = folder.displayName.toLowerCase().trim();

      // Only set as root if display name matches expected root names
      if (STANDARD_FOLDERS.includes(canonical) && !rootFolderIds[canonical]) {
        const expectedNames = ROOT_DISPLAY_NAMES[canonical] || [];
        if (expectedNames.includes(displayLower)) {
          rootFolderIds[canonical] = folder.externalFolderId;
        }
      }
    }

    // Step 3: Build parent → children lookup
    const childrenMap = new Map<string, typeof allFolders>();
    for (const folder of allFolders) {
      if (folder.parentFolderId) {
        const siblings = childrenMap.get(folder.parentFolderId) || [];
        siblings.push(folder);
        childrenMap.set(folder.parentFolderId, siblings);
      }
    }

    // Helper: get children of a folder by its externalFolderId
    const getChildFolders = (parentExternalId: string): typeof allFolders => {
      return childrenMap.get(parentExternalId) || [];
    };

    // Step 4: Categorize folders
    for (const folder of allFolders) {
      const displayNameLower = folder.displayName.toLowerCase().trim();
      const isFyxerFolder = FYXER_PATTERN.test(folder.displayName);
      const isConditional = CONDITIONAL_FOLDERS.includes(displayNameLower);
      const messageCount = folderMessageCounts.get(folder.externalFolderId) || 0;

      // Conditional folders: only show if they have emails
      if (isConditional && messageCount === 0) continue;

      // Conditional folders with emails go to custom section (below divider)
      if (isConditional && messageCount > 0) {
        tree.custom.push(folder);
        continue;
      }

      // Fyxer folders ALWAYS go to custom section
      if (isFyxerFolder) {
        tree.custom.push(folder);
        continue;
      }

      const canonical = folder.canonicalFolder || 'system';

      if (folder.parentFolderId) {
        // Subfolder - add to parent's tree if parent is a standard ROOT folder
        // Check ALL standard folders to see if this folder's parent matches any root
        for (const [standardCanonical, rootId] of Object.entries(rootFolderIds)) {
          if (folder.parentFolderId === rootId && standardCanonical in tree) {
            tree[standardCanonical].push(folder);
            break;
          }
        }
      }

      // Custom folders: anything not standard that isn't a child of another shown custom folder
      if (!STANDARD_FOLDERS.includes(canonical)) {
        // Find if parent is in our custom list (to avoid duplicating nested folders)
        const parentFolder = allFolders.find(f => f.externalFolderId === folder.parentFolderId);
        const parentIsShownCustom = parentFolder && !STANDARD_FOLDERS.includes(parentFolder.canonicalFolder || 'system');

        // Show if: no parent, OR parent is a standard folder, OR parent isn't in our folder list
        if (!parentIsShownCustom) {
          tree.custom.push(folder);
        }
      }
    }

    // Sort custom folders by display name (preserves Fyxer's numbered order)
    tree.custom.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return { folderTree: tree, getChildFolders, rootFolderIds };
  }, [allFolders, allMessages]);

  // Compute folder unread counts:
  // - Root folder badges: only count messages DIRECTLY in that folder (not subfolders)
  // - Subfolder badges: count by providerFolderId
  const { folderCounts, subfolderCounts } = useMemo(() => {
    const counts: Record<string, number> = {
      inbox: 0,
      sent: 0,
      drafts: 0,
      archive: 0,
      spam: 0,
      trash: 0,
    };
    const subCounts: Record<string, number> = {};

    for (const message of allMessages) {
      if (message.isRead) continue; // Only count unread messages

      // Count by providerFolderId for ALL folder badges
      if (message.providerFolderId) {
        subCounts[message.providerFolderId] = (subCounts[message.providerFolderId] || 0) + 1;
      }

      // For root folder badges, only count if message is DIRECTLY in that root folder
      // (not in a subfolder that inherits the same canonicalFolder)
      const canonical = message.canonicalFolder || 'inbox';
      if (canonical in counts && message.providerFolderId) {
        // Only count if this message's folder IS the root folder for this canonical type
        const rootFolderId = rootFolderIds[canonical];
        if (message.providerFolderId === rootFolderId) {
          counts[canonical]++;
        }
      }
    }

    return { folderCounts: counts, subfolderCounts: subCounts };
  }, [allMessages, rootFolderIds]);

  // Filter messages by selected folder (and subfolder if selected)
  // Sort by receivedAt descending (newest first)
  // MATCHES MICROSOFT: Root folder click shows only root folder emails, not subfolders
  const messages = useMemo(() => {
    if (!allMessages.length) return allMessages;

    let filtered: typeof allMessages;

    if (selectedFolder === 'custom' && selectedSubfolderId) {
      // Custom folder - filter by providerFolderId
      filtered = allMessages.filter(m => m.providerFolderId === selectedSubfolderId);
    } else if (selectedSubfolderId) {
      // Subfolder selected - filter by specific providerFolderId
      filtered = allMessages.filter(m => m.providerFolderId === selectedSubfolderId);
    } else {
      // Root canonical folder selected - filter by the root folder's providerFolderId
      // This ensures we only show direct messages, not subfolder messages
      const rootFolderId = rootFolderIds[selectedFolder];
      if (rootFolderId) {
        filtered = allMessages.filter(m => m.providerFolderId === rootFolderId);
      } else {
        // Fallback: no root folder found, use canonicalFolder
        filtered = allMessages.filter(m => (m.canonicalFolder || 'inbox') === selectedFolder);
      }
    }

    // Sort by receivedAt descending (newest first)
    return filtered.sort((a, b) => b.receivedAt - a.receivedAt);
  }, [allMessages, selectedFolder, selectedSubfolderId, rootFolderIds]);

  // Build flat list of virtual items (headers + messages) for virtualization
  type VirtualItem =
    | { type: 'header'; bucket: string }
    | { type: 'message'; message: typeof messages[0]; bucket: string };

  const virtualItems = useMemo((): VirtualItem[] => {
    const items: VirtualItem[] = [];
    let lastBucket: string | null = null;

    for (const message of messages) {
      const bucket = getTimeBucket(message.receivedAt);

      // Add header when bucket changes
      if (bucket !== lastBucket) {
        items.push({ type: 'header', bucket });
        lastBucket = bucket;
      }

      // Add message (skip if section is collapsed)
      if (!collapsedSections.has(bucket)) {
        items.push({ type: 'message', message, bucket });
      }
    }

    return items;
  }, [messages, collapsedSections]);

  // Ref for virtual scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: virtualItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => virtualItems[index].type === 'header' ? 32 : 72,
    overscan: 5,
  });

  // Get selected message data from FUSE (only when single selection)
  const selectedMessage = useMemo(() => {
    // Only show message content when exactly one is selected
    if (selectedMessageIds.size !== 1) return null;

    const selectedId = [...selectedMessageIds][0];
    return allMessages.find(m => m._id === selectedId) ?? null;
  }, [selectedMessageIds, allMessages]);

  const handleResize = useCallback((handle: 'mailbox' | 'threads', e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const containerRect = container.getBoundingClientRect();
    const startMailboxWidth = mailboxWidth;
    const startThreadsWidth = threadsWidth ?? containerRect.width * 0.25;

    // Track the new width during drag
    let newMailboxWidth = startMailboxWidth;
    let newThreadsWidth = startThreadsWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (handle === 'mailbox') {
        newMailboxWidth = Math.max(120, Math.min(300, startMailboxWidth + deltaX));
        container.style.gridTemplateColumns = `${newMailboxWidth}px 12px ${threadsWidth ? threadsWidth + 'px' : '1fr'} 12px 1fr`;
      } else {
        newThreadsWidth = Math.max(150, startThreadsWidth + deltaX);
        container.style.gridTemplateColumns = `${mailboxWidth}px 12px ${newThreadsWidth}px 12px 1fr`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Persist to state and localStorage
      if (handle === 'mailbox') {
        setMailboxWidth(newMailboxWidth);
        localStorage.setItem(STORAGE_KEY_MAILBOX, String(newMailboxWidth));
      } else {
        setThreadsWidth(newThreadsWidth);
        localStorage.setItem(STORAGE_KEY_THREADS, String(newThreadsWidth));
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [mailboxWidth, threadsWidth]);

  return (
    <div className="ft-email">
      {/* ─────────────────────────────────────────────────────────────
          HEADER BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="ft-email__header">
        <div className="ft-email__header-left">
          <T.body weight="medium">Email</T.body>
        </div>
        <div className="ft-email__header-right" />
      </header>

      {/* ─────────────────────────────────────────────────────────────
          THREE-RAIL LAYOUT (with resize handles)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="ft-email__body"
        ref={containerRef}
        style={{
          gridTemplateColumns: `${mailboxWidth}px 12px ${threadsWidth ? threadsWidth + 'px' : '1fr'} 12px 1fr`,
        }}
      >
        {/* RAIL 1: Mailbox */}
        <aside className="ft-email__mailbox" onContextMenu={handleMailboxContextMenu}>
          {/* Inbox with expandable subfolders */}
          <div className="ft-email__folder-group">
            <div
              className={`ft-email__folder ${selectedFolder === 'inbox' && !selectedSubfolderId ? 'ft-email__folder--selected' : ''}`}
              onClick={() => handleFolderSelect('inbox')}
            >
              {folderTree.inbox.length > 0 && (
                <span
                  className={`ft-email__folder-chevron ${expandedFolders.has('inbox') ? 'ft-email__folder-chevron--expanded' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpand('inbox'); }}
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
                toggleFolderExpand={toggleFolderExpand}
                onSelect={handleSubfolderSelect}
                onContextMenu={handleFolderContextMenu}
                contextMenuFolderId={contextMenu?.folderId}
                unreadCounts={subfolderCounts}
              />
            )}
          </div>

          {/* Drafts */}
          <div
            className={`ft-email__folder ${selectedFolder === 'drafts' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => handleFolderSelect('drafts')}
          >
            <span className="ft-email__folder-icon">✏️</span>
            <span className="ft-email__folder-label">Drafts</span>
            {folderCounts.drafts > 0 && (
              <span className="ft-email__folder-count">{folderCounts.drafts}</span>
            )}
          </div>

          {/* Sent */}
          <div
            className={`ft-email__folder ${selectedFolder === 'sent' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => handleFolderSelect('sent')}
          >
            <span className="ft-email__folder-icon">📨</span>
            <span className="ft-email__folder-label">Sent</span>
            {folderCounts.sent > 0 && (
              <span className="ft-email__folder-count">{folderCounts.sent}</span>
            )}
          </div>

          {/* Archive with expandable subfolders */}
          <div className="ft-email__folder-group">
            <div
              className={`ft-email__folder ${selectedFolder === 'archive' && !selectedSubfolderId ? 'ft-email__folder--selected' : ''}`}
              onClick={() => handleFolderSelect('archive')}
            >
              {folderTree.archive.length > 0 && (
                <span
                  className={`ft-email__folder-chevron ${expandedFolders.has('archive') ? 'ft-email__folder-chevron--expanded' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpand('archive'); }}
                >
                  ›
                </span>
              )}
              <span className="ft-email__folder-icon">🔍</span>
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
                toggleFolderExpand={toggleFolderExpand}
                onSelect={handleSubfolderSelect}
                onContextMenu={handleFolderContextMenu}
                contextMenuFolderId={contextMenu?.folderId}
                unreadCounts={subfolderCounts}
              />
            )}
          </div>

          {/* Deleted with expandable subfolders */}
          <div className="ft-email__folder-group">
            <div
              className={`ft-email__folder ${selectedFolder === 'trash' && !selectedSubfolderId ? 'ft-email__folder--selected' : ''}`}
              onClick={() => handleFolderSelect('trash')}
            >
              {folderTree.trash.length > 0 && (
                <span
                  className={`ft-email__folder-chevron ${expandedFolders.has('trash') ? 'ft-email__folder-chevron--expanded' : ''}`}
                  onClick={(e) => { e.stopPropagation(); toggleFolderExpand('trash'); }}
                >
                  ›
                </span>
              )}
              <span className="ft-email__folder-icon">🗑️</span>
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
                toggleFolderExpand={toggleFolderExpand}
                onSelect={handleSubfolderSelect}
                onContextMenu={handleFolderContextMenu}
                contextMenuFolderId={contextMenu?.folderId}
                unreadCounts={subfolderCounts}
              />
            )}
          </div>

          {/* Junk */}
          <div
            className={`ft-email__folder ${selectedFolder === 'spam' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => handleFolderSelect('spam')}
          >
            <span className="ft-email__folder-icon">⛔️</span>
            <span className="ft-email__folder-label">Spam</span>
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
                    onClick={() => {
                      setSelectedFolder('custom');
                      setSelectedSubfolderId(folder.externalFolderId);
                    }}
                    onContextMenu={(e) => handleFolderContextMenu(folder._id, e)}
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

        {/* RESIZE HANDLE 1: Between Mailbox and Threads */}
        <div
          className="ft-email__resize-handle"
          onMouseDown={(e) => handleResize('mailbox', e)}
        />

        {/* RAIL 2: Message List */}
        <section className="ft-email__threads" onContextMenu={handleListContextMenu}>
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
              onClick={triggerManualSync}
              disabled={isSyncing}
              title={isSyncing ? 'Syncing...' : 'Send and receive all items'}
            >
              <Icon variant="refresh" size="xs" strokeWidth={1.5} />
            </button>
          </div>
          <div className="ft-email__threads-scroll" ref={scrollContainerRef}>
            {!flags.isHydrated ? (
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
                        onClick={() => toggleSection(item.bucket)}
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
                      className={`ft-email__thread-item ${selectedMessageIds.has(message._id) ? 'ft-email__thread-item--selected' : ''} ${!message.isRead ? 'ft-email__thread-item--unread' : ''}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={(e) => handleMessageClick(message._id, e)}
                      onContextMenu={(e) => handleMessageContextMenu(message._id, e)}
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
                      <div className="ft-email__thread-snippet">{message.snippet}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* RESIZE HANDLE 2: Between Threads and Reading */}
        <div
          className="ft-email__resize-handle"
          onMouseDown={(e) => handleResize('threads', e)}
        />

        {/* RAIL 3: Reading Pane */}
        <main className="ft-email__reading" onContextMenu={handleReadingContextMenu}>
          <div className="ft-email__reading-scroll">
            {selectedMessageIds.size === 0 ? (
              <div className="ft-email__empty"><T.body color="secondary">Select an email to read</T.body></div>
            ) : selectedMessageIds.size > 1 ? (
              <div className="ft-email__empty"><T.body color="secondary">{selectedMessageIds.size} items selected</T.body></div>
            ) : !flags.isHydrated ? (
              <div className="ft-email__loading"><T.body color="secondary">Loading...</T.body></div>
            ) : selectedMessage === null ? (
              <div className="ft-email__empty"><T.body color="secondary">Message not found</T.body></div>
            ) : (
              <>
                <div className="ft-email__reading-subject">{selectedMessage.subject}</div>
                <div className="ft-email__message-header">
                  <strong>From:</strong> {selectedMessage.from.name || selectedMessage.from.email}<br />
                  <strong>Date:</strong> {new Date(selectedMessage.receivedAt).toLocaleString()}<br />
                  <strong>To:</strong> {selectedMessage.to.map(r => r.name || r.email).join(', ')}
                </div>
                <hr />
                <MessageBody messageId={selectedMessage._id as Id<'productivity_email_Index'>} />
              </>
            )}
          </div>{/* end reading-scroll */}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="ft-email__context-backdrop"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="ft-email__context-menu"
            style={{ '--ctx-x': `${contextMenu.x}px`, '--ctx-y': `${contextMenu.y}px` } as React.CSSProperties}
          >
            {/* MAILBOX SIDEBAR - folder actions */}
            {contextMenu.area === 'mailbox' && (
              <>
                <button onClick={() => handleContextAction('newFolder')}>New Folder</button>
                <button onClick={() => handleContextAction('markAllRead')}>Mark All as Read</button>
                <hr />
                <button onClick={() => handleContextAction('refresh')}>Refresh</button>
              </>
            )}

            {/* FOLDER - individual folder actions */}
            {contextMenu.area === 'folder' && contextMenu.folderId && (
              <>
                <button onClick={() => handleContextAction('openFolder')}>Open</button>
                <button onClick={() => handleContextAction('markAllRead')}>Mark All as Read</button>
                <hr />
                <button onClick={() => handleContextAction('deleteFolder')}>Delete</button>
              </>
            )}

            {/* MESSAGE LIST - email actions */}
            {contextMenu.area === 'list' && (contextMenu.messageId || selectedMessageIds.size > 0) && (
              <>
                <button onClick={() => handleContextAction('open')}>Open</button>
                <hr />
                <button onClick={() => handleContextAction('reply')}>Reply</button>
                <button onClick={() => handleContextAction('replyAll')}>Reply All</button>
                <button onClick={() => handleContextAction('forward')}>Forward</button>
                <hr />
                <button onClick={() => handleContextAction('markRead')}>Mark as Read</button>
                <button onClick={() => handleContextAction('markUnread')}>Mark as Unread</button>
                <hr />
                <button onClick={() => handleContextAction('archive')}>Archive</button>
                <button onClick={() => handleContextAction('delete')}>Delete</button>
              </>
            )}

            {/* MESSAGE LIST - empty area (no message selected) */}
            {contextMenu.area === 'list' && !contextMenu.messageId && selectedMessageIds.size === 0 && (
              <>
                <button onClick={() => handleContextAction('newEmail')}>New Email</button>
                <button onClick={() => handleContextAction('refresh')}>Refresh</button>
              </>
            )}

            {/* READING PANE - content actions */}
            {contextMenu.area === 'reading' && (
              <>
                <button onClick={() => handleContextAction('reply')}>Reply</button>
                <button onClick={() => handleContextAction('replyAll')}>Reply All</button>
                <button onClick={() => handleContextAction('forward')}>Forward</button>
                <hr />
                <button onClick={() => handleContextAction('print')}>Print</button>
                <hr />
                <button onClick={() => handleContextAction('delete')}>Delete</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
