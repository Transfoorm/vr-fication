'use client';

// EMAIL CONSOLE - Outlook Web Clone (FUSE Golden Bridge pattern)

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useProductivityData } from '@/hooks/useProductivityData';
import { useEmailSyncIntent } from '@/hooks/useEmailSyncIntent';
import { useEmailBodySync } from '@/hooks/useEmailBodySync';
import { useFuse } from '@/store/fuse';
import { T, Input } from '@/vr';
import type { Id } from '@/convex/_generated/dataModel';
import { useEmailActions } from './useEmailActions';
import { useViewportPrefetch } from './useViewportPrefetch';
import {
  getSavedWidth,
  getStorageKeys,
  DEFAULTS,
  resetColumnWidths,
  getGridTemplate,
  buildFolderTree,
  computeFolderCounts,
  filterMessages,
  buildVirtualItems,
} from './utils';
import { EmailSidebar } from './EmailSidebar';
import { EmailMessageList } from './EmailMessageList';
import { EmailContextMenu } from './EmailContextMenu';
import { MessageBody } from './MessageBody';
import type { EmailFolder } from './types';
import './email-console.css';



export function EmailConsole() {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  // Clear error param from URL on mount (prevents re-showing on refresh)
  useEffect(() => {
    if (searchParams.get('outlook_error')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  // Content width mode - persisted to localStorage (declare early for column init)
  const [contentWidth, setContentWidth] = useState<'full' | 'constrained'>(() => {
    if (typeof window === 'undefined') return 'full';
    return (localStorage.getItem('email-content-width') as 'full' | 'constrained') || 'full';
  });

  // Column widths - initialized from localStorage per mode
  const [mailboxWidth, setMailboxWidth] = useState(() => {
    const mode = typeof window !== 'undefined'
      ? (localStorage.getItem('email-content-width') as 'full' | 'constrained') || 'full'
      : 'full';
    const keys = getStorageKeys(mode);
    return getSavedWidth(keys.mailbox, DEFAULTS[mode].mailbox);
  });
  const [threadsWidth, setThreadsWidth] = useState<number>(() => {
    const mode = typeof window !== 'undefined'
      ? (localStorage.getItem('email-content-width') as 'full' | 'constrained') || 'full'
      : 'full';
    const keys = getStorageKeys(mode);
    return getSavedWidth(keys.threads, DEFAULTS[mode].threads);
  });

  // Get data from FUSE (Golden Bridge pattern)
  const { data, flags } = useProductivityData();

  // Get user's Convex ID for actions
  const user = useFuse((state) => state.user);
  const userId = user?.convexId as Id<'admin_users'> | undefined;

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
  // This controls thread list highlighting (changes immediately on click)
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());

  // Displayed message ID - controls reading pane content
  // Decoupled from selection: only updates when body is ready (Outlook pattern)
  const [displayedMessageId, setDisplayedMessageId] = useState<string | null>(null);

  // Anchor message for Shift+click range selection
  const [anchorMessageId, setAnchorMessageId] = useState<string | null>(null);

  // Read email bodies from FUSE to know when content is ready
  const emailBodies = useFuse((state) => state.productivity.emailBodies);

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

  // Keyboard navigation mode (suppresses hover while using arrow keys)
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);

  // Visible message IDs for viewport prefetch
  const [visibleMessageIds, setVisibleMessageIds] = useState<string[]>([]);

  // Expanded folders state (for sidebar folder tree) - persisted to localStorage
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    const saved = localStorage.getItem('email-expanded-folders');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Handle width mode change - switches column widths to match mode
  const handleWidthChange = (value: string) => {
    const newMode = value as 'full' | 'constrained';

    // Save current widths to current mode before switching
    const currentKeys = getStorageKeys(contentWidth);
    localStorage.setItem(currentKeys.mailbox, String(mailboxWidth));
    localStorage.setItem(currentKeys.threads, String(threadsWidth));

    // Load widths for new mode
    const newKeys = getStorageKeys(newMode);
    const newMailbox = getSavedWidth(newKeys.mailbox, DEFAULTS[newMode].mailbox);
    const newThreads = getSavedWidth(newKeys.threads, DEFAULTS[newMode].threads);

    // Switch everything
    setMailboxWidth(newMailbox);
    setThreadsWidth(newThreads);
    setContentWidth(newMode);
    localStorage.setItem('email-content-width', newMode);
  };

  // Handle folder selection (canonical folder)
  const handleFolderSelect = (folder: string) => {
    setSelectedFolder(folder);
    setSelectedSubfolderId(null); // Clear subfolder when selecting a top-level folder
  };

  // Handle subfolder selection
  const handleSubfolderSelect = (subfolder: EmailFolder) => {
    setSelectedFolder(subfolder.canonicalFolder); // Set parent canonical folder
    setSelectedSubfolderId(subfolder.externalFolderId); // Set specific subfolder
  };

  // Handle custom folder selection
  const handleCustomFolderSelect = (folderId: string) => {
    setSelectedFolder('custom');
    setSelectedSubfolderId(folderId);
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

  // Context menu handler factory for simple areas
  const createContextHandler = (area: 'mailbox' | 'list' | 'reading') => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, area, messageId: null, folderId: null });
  };
  const handleMailboxContextMenu = createContextHandler('mailbox');
  const handleListContextMenu = createContextHandler('list');
  const handleReadingContextMenu = createContextHandler('reading');

  // Handle right-click on a folder in the sidebar
  const handleFolderContextMenu = (folderId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ x: event.clientX, y: event.clientY, area: 'folder', messageId: null, folderId });
  };

  // Handle right-click inside email body iframe (called with raw coordinates)
  const handleIframeContextMenu = useCallback((x: number, y: number) => {
    setContextMenu({ x, y, area: 'reading', messageId: null, folderId: null });
  }, []);

  // Build folder tree using utility function
  const { folderTree, getChildFolders, rootFolderIds } = useMemo(
    () => buildFolderTree(allFolders, allMessages),
    [allFolders, allMessages]
  );

  // Compute folder unread counts using utility function
  const { folderCounts, subfolderCounts } = useMemo(
    () => computeFolderCounts(allMessages, rootFolderIds),
    [allMessages, rootFolderIds]
  );

  // Filter messages by selected folder using utility function
  const messages = useMemo(
    () => filterMessages(allMessages, selectedFolder, selectedSubfolderId, rootFolderIds),
    [allMessages, selectedFolder, selectedSubfolderId, rootFolderIds]
  );

  // Build virtual items using utility function
  const virtualItems = useMemo(
    () => buildVirtualItems(messages, collapsedSections),
    [messages, collapsedSections]
  );

  // Email actions hook
  const { handleContextAction: baseHandleContextAction } = useEmailActions({
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
  });

  // Wrap context action to handle layout reset locally
  const handleContextAction = useCallback((action: string) => {
    if (action === 'resetLayout') {
      resetColumnWidths(contentWidth);
      setMailboxWidth(DEFAULTS[contentWidth].mailbox);
      setThreadsWidth(DEFAULTS[contentWidth].threads);
      setContextMenu(null);
      return;
    }
    baseHandleContextAction(action);
  }, [baseHandleContextAction, setContextMenu, contentWidth]);

  // Auto-select first message when inbox loads (Outlook Web behavior)
  useEffect(() => {
    if (messages.length > 0 && selectedMessageIds.size === 0) {
      setSelectedMessageIds(new Set([messages[0]._id]));
    }
  }, [messages, selectedMessageIds.size]);

  // Keyboard navigation: Arrow Up/Down to move between emails
  // Shift+Arrow extends selection (multi-select)
  // Cmd/Ctrl+A to select all
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Cmd+A (Mac) or Ctrl+A (Windows) - Select All
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (messages.length > 0) {
          const allIds = new Set(messages.map(m => m._id));
          setSelectedMessageIds(allIds);
          console.log(`✅ Selected all ${allIds.size} messages (keyboard)`);
        }
        return;
      }

      // Only handle arrow keys beyond this point
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;

      // Need messages to navigate
      if (messages.length === 0) return;

      e.preventDefault();

      // Enter keyboard navigation mode (suppresses hover on old item)
      setIsKeyboardNav(true);

      // Find current selection indices
      const selectedIndices = [...selectedMessageIds]
        .map(id => messages.findIndex(m => m._id === id))
        .filter(idx => idx !== -1)
        .sort((a, b) => a - b);

      // For Shift+Arrow, use the edge in the direction of movement
      // For regular arrow, use any selected item
      let currentIndex: number;
      if (e.shiftKey && selectedIndices.length > 0) {
        // Going UP: extend from topmost; Going DOWN: extend from bottommost
        currentIndex = e.key === 'ArrowUp'
          ? selectedIndices[0]
          : selectedIndices[selectedIndices.length - 1];
      } else {
        currentIndex = selectedIndices.length > 0 ? selectedIndices[0] : -1;
      }

      // Calculate new index
      let newIndex: number;
      if (e.key === 'ArrowUp') {
        newIndex = currentIndex <= 0 ? 0 : currentIndex - 1;
      } else {
        newIndex = currentIndex >= messages.length - 1 ? messages.length - 1 : currentIndex + 1;
      }

      const newMessageId = messages[newIndex]._id;

      if (e.shiftKey) {
        // Shift+Arrow: Extend selection from anchor to new position
        const anchorIndex = anchorMessageId
          ? messages.findIndex(m => m._id === anchorMessageId)
          : currentIndex;

        const start = Math.min(anchorIndex, newIndex);
        const end = Math.max(anchorIndex, newIndex);

        // Select all messages in range
        const rangeIds = new Set<string>();
        for (let i = start; i <= end; i++) {
          rangeIds.add(messages[i]._id);
        }
        setSelectedMessageIds(rangeIds);
        // Keep anchor unchanged for continued Shift+Arrow
      } else {
        // Regular arrow: Select only new message
        setSelectedMessageIds(new Set([newMessageId]));
        setAnchorMessageId(newMessageId);
      }

      // Scroll into view (after React renders)
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-message-id="${newMessageId}"]`);
        element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [messages, selectedMessageIds, anchorMessageId]);

  // Decoupled display: update displayedMessageId only when body is ready
  // This keeps the old email visible until the new one is loaded (Outlook pattern)
  useEffect(() => {
    // Only applies to single selection
    if (selectedMessageIds.size !== 1) return;

    const selectedId = [...selectedMessageIds][0];

    // If body is already in FUSE, swap immediately
    if (emailBodies?.[selectedId]) {
      setDisplayedMessageId(selectedId);
    }
    // Otherwise, the effect will re-run when emailBodies updates
  }, [selectedMessageIds, emailBodies]);

  // Auto-mark-read hooks (only Convex mutations - FUSE actions via getState() for stable deps)
  const updateConvexReadStatus = useMutation(api.productivity.email.outlookActions.updateMessageReadStatus);
  const batchSyncReadStatus = useAction(api.productivity.email.outlookActions.batchMarkOutlookReadStatus);

  // Auto-mark as read: 1s after selecting an unread email
  // HARDENED: Timer won't reset on Convex updates, only on selection change
  const autoMarkTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoMarkTimerForIdRef = useRef<string | null>(null); // Track which ID the timer is for

  useEffect(() => {
    const currentSelectedId = selectedMessageIds.size === 1 ? [...selectedMessageIds][0] : null;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Effect run: selected=${currentSelectedId?.slice(-8) ?? 'none'}, timerFor=${autoMarkTimerForIdRef.current?.slice(-8) ?? 'none'}, hasTimer=${!!autoMarkTimerRef.current}`);
    }

    // GUARD: Only reset timer if selection actually changed
    if (autoMarkTimerForIdRef.current === currentSelectedId && autoMarkTimerRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ Same selection, timer running - no reset`);
      }
      return;
    }

    // Selection changed - clear old timer
    if (autoMarkTimerRef.current) {
      clearTimeout(autoMarkTimerRef.current);
      autoMarkTimerRef.current = null;
      autoMarkTimerForIdRef.current = null;
    }

    // No selection or no user
    if (!currentSelectedId || !userId) {
      return () => {
        if (autoMarkTimerRef.current) {
          clearTimeout(autoMarkTimerRef.current);
          autoMarkTimerRef.current = null;
          autoMarkTimerForIdRef.current = null;
        }
      };
    }

    // Start timer - check message state when it fires
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Starting timer for ${currentSelectedId.slice(-8)}`);
    }
    autoMarkTimerForIdRef.current = currentSelectedId;
    autoMarkTimerRef.current = setTimeout(async () => {
      autoMarkTimerForIdRef.current = null; // Timer fired, clear tracking

      // Read fresh state at timer fire time
      const state = useFuse.getState();
      const freshMessages = state.productivity.email?.messages;
      const freshMessage = freshMessages?.find(m => m._id === currentSelectedId);

      // Bail conditions (checked at fire time, not effect time)
      if (!freshMessage) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ Skip ${currentSelectedId.slice(-8)}: not in FUSE`);
        }
        return;
      }
      if (freshMessage.isRead) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏱️ Skip ${currentSelectedId.slice(-8)}: already read`);
        }
        return;
      }

      console.log(`⏱️ Auto-mark: ${currentSelectedId.slice(-8)} → read`);

      // 1. Instant UI update via FUSE
      state.updateEmailReadStatus(currentSelectedId, true);

      // 2. Persist to Convex DB with rollback on failure
      try {
        await updateConvexReadStatus({
          userId: userId!,
          messageId: currentSelectedId as Id<'productivity_email_Index'>,
          isRead: true,
        });
      } catch (error) {
        console.error('❌ Auto-mark Convex failed, rolling back UI:', error);
        state.updateEmailReadStatus(currentSelectedId, false); // ROLLBACK
        return; // Don't sync to Outlook if Convex failed
      } finally {
        // 10 second protection window - Convex live queries can be slow to reflect mutations
        setTimeout(() => state.clearPendingReadUpdate(currentSelectedId), 10000);
      }

      // 3. Fire-and-forget Outlook sync (silent failures)
      batchSyncReadStatus({
        userId: userId!,
        messageIds: [currentSelectedId as Id<'productivity_email_Index'>],
        isRead: true,
      }).catch(() => {
        // Silent - WebSocket drops are irrelevant to UX
      });
    }, 1000);

    // Cleanup: only clear timer (exempt is cleared on arrival, not departure)
    return () => {
      if (autoMarkTimerRef.current) {
        clearTimeout(autoMarkTimerRef.current);
        autoMarkTimerRef.current = null;
        autoMarkTimerForIdRef.current = null;
      }
    };
  // STABLE: Only re-run on selection change, not on Convex updates
  }, [selectedMessageIds, userId, updateConvexReadStatus, batchSyncReadStatus]);

  // Get the currently selected message ID (for triggering fetch)
  const selectedId = selectedMessageIds.size === 1 ? [...selectedMessageIds][0] : null;

  // Get displayed message data from FUSE (what's shown in reading pane)
  const displayedMessage = useMemo(() => {
    if (!displayedMessageId) return null;
    return allMessages.find(m => m._id === displayedMessageId) ?? null;
  }, [displayedMessageId, allMessages]);

  // Trigger fetch for selected message (runs in background while old email displayed)
  useEmailBodySync(selectedId as Id<'productivity_email_Index'> | null);

  // Viewport prefetch: preload visible email bodies before user clicks
  useViewportPrefetch(visibleMessageIds, selectedId);

  const handleResize = useCallback((handle: 'mailbox' | 'threads', e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const startMailboxWidth = mailboxWidth;
    const startThreadsWidth = threadsWidth;

    // Track the new width during drag
    let newMailboxWidth = startMailboxWidth;
    let newThreadsWidth = startThreadsWidth;

    // Add resizing class to disable iframe pointer events
    container.classList.add('ft-email__body--resizing');

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (contentWidth === 'full') {
        // FULL MODE: Original behavior - no max constraints
        if (handle === 'mailbox') {
          newMailboxWidth = Math.max(120, Math.min(300, startMailboxWidth + deltaX));
          container.style.gridTemplateColumns = getGridTemplate(newMailboxWidth, threadsWidth);
        } else {
          newThreadsWidth = Math.max(150, startThreadsWidth + deltaX);
          container.style.gridTemplateColumns = getGridTemplate(mailboxWidth, newThreadsWidth);
        }
      } else {
        // CENTERED MODE: Constrained container - enforce max limits
        // Use MINIMUM widths for constraints so columns can always resize
        const CONSTRAINED_WIDTH = 1320;
        const minMailbox = 120;
        const minThreads = 150;
        const minReadingPane = 250;
        const handleSpace = 24;

        if (handle === 'mailbox') {
          // Max mailbox = total minus minimums for threads and reading
          const maxMailbox = Math.min(300, CONSTRAINED_WIDTH - handleSpace - minThreads - minReadingPane);
          newMailboxWidth = Math.max(minMailbox, Math.min(maxMailbox, startMailboxWidth + deltaX));
          container.style.gridTemplateColumns = getGridTemplate(newMailboxWidth, threadsWidth);
        } else {
          // Max threads = total minus minimums for mailbox and reading
          const maxThreads = CONSTRAINED_WIDTH - handleSpace - minMailbox - minReadingPane;
          newThreadsWidth = Math.max(minThreads, Math.min(maxThreads, startThreadsWidth + deltaX));
          container.style.gridTemplateColumns = getGridTemplate(mailboxWidth, newThreadsWidth);
        }
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // Remove resizing class to restore iframe pointer events
      container.classList.remove('ft-email__body--resizing');

      // Persist to state and localStorage (using mode-specific keys)
      const keys = getStorageKeys(contentWidth);
      if (handle === 'mailbox') {
        setMailboxWidth(newMailboxWidth);
        localStorage.setItem(keys.mailbox, String(newMailboxWidth));
      } else {
        setThreadsWidth(newThreadsWidth);
        localStorage.setItem(keys.threads, String(newThreadsWidth));
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [mailboxWidth, threadsWidth, contentWidth]);

  return (
    <div className="ft-email">
      <header className={`ft-email__header ${contentWidth === 'constrained' ? 'ft-email__header--constrained' : ''}`}>
        <div className="ft-email__header-left"><T.body weight="medium">Email</T.body></div>
        <div className="ft-email__header-right">
          <Input.radio
            value={contentWidth}
            onChange={handleWidthChange}
            options={[
              { value: 'full', label: 'Full' },
              { value: 'constrained', label: 'Centered' },
            ]}
            direction="horizontal"
            size="sm"
            weight="light"
          />
        </div>
      </header>

      <div
        className={`ft-email__body ${contentWidth === 'constrained' ? 'ft-email__body--constrained' : ''}`}
        ref={containerRef}
        style={{
          gridTemplateColumns: getGridTemplate(mailboxWidth, threadsWidth),
        }}
      >
        <EmailSidebar
          selectedFolder={selectedFolder}
          selectedSubfolderId={selectedSubfolderId}
          expandedFolders={expandedFolders}
          folderTree={folderTree}
          folderCounts={folderCounts}
          subfolderCounts={subfolderCounts}
          contextMenuFolderId={contextMenu?.folderId ?? null}
          getChildFolders={getChildFolders}
          onFolderSelect={handleFolderSelect}
          onSubfolderSelect={handleSubfolderSelect}
          onToggleFolderExpand={toggleFolderExpand}
          onContextMenu={handleMailboxContextMenu}
          onFolderContextMenu={handleFolderContextMenu}
          onCustomFolderSelect={handleCustomFolderSelect}
        />

        <div className="ft-email__resize-handle" onMouseDown={(e) => handleResize('mailbox', e)} />

        <EmailMessageList
          selectedFolder={selectedFolder}
          selectedSubfolderId={selectedSubfolderId}
          allFolders={allFolders}
          messages={messages}
          isSyncing={isSyncing}
          isHydrated={flags.isHydrated}
          selectedMessageIds={selectedMessageIds}
          virtualItems={virtualItems}
          collapsedSections={collapsedSections}
          isKeyboardNav={isKeyboardNav}
          onToggleSection={toggleSection}
          onMessageClick={handleMessageClick}
          onMessageContextMenu={handleMessageContextMenu}
          onListContextMenu={handleListContextMenu}
          onRefresh={triggerManualSync}
          onMouseMove={() => setIsKeyboardNav(false)}
          onVisibleIdsChange={setVisibleMessageIds}
        />

        <div className="ft-email__resize-handle" onMouseDown={(e) => handleResize('threads', e)} />

        <main className="ft-email__reading" onContextMenu={handleReadingContextMenu}>
          <div className="ft-email__reading-scroll">
            {selectedMessageIds.size === 0 ? (
              <div className="ft-email__empty"><T.body color="secondary">Select an email to read</T.body></div>
            ) : selectedMessageIds.size > 1 ? (
              <div className="ft-email__empty"><T.body color="secondary">{selectedMessageIds.size} items selected</T.body></div>
            ) : !flags.isHydrated ? (
              <div className="ft-email__loading"><T.body color="secondary">Loading...</T.body></div>
            ) : displayedMessage === null ? (
              <div className="ft-email__empty"><T.body color="secondary">Message not found</T.body></div>
            ) : (
              <>
                <div className="ft-email__reading-header">
                  <div className="ft-email__reading-subject">{displayedMessage.subject}</div>
                  <div className="ft-email__message-header">
                    <strong>From:</strong> {displayedMessage.from.name || displayedMessage.from.email}<br />
                    <strong>Date:</strong> {new Date(displayedMessage.receivedAt).toLocaleString()}<br />
                    <strong>To:</strong> {displayedMessage.to.map(r => r.name || r.email).join(', ')}
                  </div>
                  <hr />
                </div>
                <MessageBody messageId={displayedMessageId as Id<'productivity_email_Index'>} onContextMenu={handleIframeContextMenu} />
              </>
            )}
          </div>
        </main>
      </div>

      {contextMenu && (
        <EmailContextMenu
          contextMenu={contextMenu}
          selectedMessageIds={selectedMessageIds}
          onClose={() => setContextMenu(null)}
          onAction={handleContextAction}
        />
      )}
    </div>
  );
}
