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
│  │ MAILBOX   │ THREAD LIST         │ READING PANE                  │ │
│  └───────────┴─────────────────────┴───────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────*/

import { useRef, useCallback, useState, useMemo } from 'react';
import { useProductivityData } from '@/hooks/useProductivityData';
import { T } from '@/vr';
import './email-console.css';

/** Get time bucket for grouping */
function getTimeBucket(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= thisWeekStart) return 'This Week';
  if (date >= lastWeekStart) return 'Last Week';
  if (date >= thisMonthStart) return 'This Month';
  if (date >= lastMonthStart) return 'Last Month';
  return 'Older';
}

/** Format date like Outlook Web: today=time, recent=day+time, older=day+date */
function formatThreadDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayShort = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayDate = `${date.getDate()}/${date.getMonth() + 1}`;

  if (date >= today) {
    // Today: just time
    return time;
  } else if (date >= yesterday) {
    // Yesterday: day + time
    return `${dayShort} ${time}`;
  } else if (date >= oneWeekAgo) {
    // Within a week: day + time
    return `${dayShort} ${time}`;
  } else {
    // Older: day + date
    return `${dayShort} ${dayDate}`;
  }
}

export function EmailConsole() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mailboxWidth = useRef(180);
  const threadsWidth = useRef<number | null>(null); // null = use flex

  // Get data from FUSE (Golden Bridge pattern)
  const { data, flags } = useProductivityData();

  // Memoize arrays to prevent new references on every render
  const allThreads = useMemo(() => data.email?.threads ?? [], [data.email?.threads]);
  const allMessages = useMemo(() => data.email?.messages ?? [], [data.email?.messages]);
  const emailAccounts = useMemo(() => data.email?.accounts ?? [], [data.email?.accounts]);

  // Selected folder state
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox');

  // Selected thread state
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

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

  // Get all connected email addresses (lowercase for comparison)
  const myEmails = useMemo(() => {
    if (!emailAccounts.length) return new Set<string>();
    return new Set(emailAccounts.map(acc => acc.emailAddress.toLowerCase()));
  }, [emailAccounts]);

  // Compute folder counts
  const folderCounts = useMemo(() => {
    if (!allThreads.length || myEmails.size === 0) return { inbox: 0, sent: 0 };

    const inbox = allThreads.filter(t => !t.latestFrom || !myEmails.has(t.latestFrom.email.toLowerCase())).length;
    const sent = allThreads.filter(t => t.latestFrom && myEmails.has(t.latestFrom.email.toLowerCase())).length;

    return { inbox, sent };
  }, [allThreads, myEmails]);

  // Filter threads by selected folder
  const threads = useMemo(() => {
    if (!allThreads.length || myEmails.size === 0) return allThreads;

    switch (selectedFolder) {
      case 'sent':
        return allThreads.filter(t => t.latestFrom && myEmails.has(t.latestFrom.email.toLowerCase()));
      case 'inbox':
      default:
        return allThreads.filter(t => !t.latestFrom || !myEmails.has(t.latestFrom.email.toLowerCase()));
    }
  }, [allThreads, myEmails, selectedFolder]);

  // Get selected thread data from FUSE
  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    const thread = allThreads.find(t => t.threadId === selectedThreadId);
    if (!thread) return null;

    // Get messages for this thread from FUSE
    const threadMessages = allMessages.filter(m => m.externalThreadId === selectedThreadId);

    return {
      ...thread,
      messages: threadMessages,
    };
  }, [selectedThreadId, allThreads, allMessages]);

  const handleResize = useCallback((handle: 'mailbox' | 'threads', e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const containerRect = container.getBoundingClientRect();
    const startMailboxWidth = mailboxWidth.current;
    const startThreadsWidth = threadsWidth.current ?? containerRect.width * 0.25;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (handle === 'mailbox') {
        const newWidth = Math.max(120, Math.min(300, startMailboxWidth + deltaX));
        mailboxWidth.current = newWidth;
        container.style.gridTemplateColumns = `${newWidth}px 12px ${threadsWidth.current ? threadsWidth.current + 'px' : '1fr'} 12px 1fr`;
      } else {
        const newWidth = Math.max(150, startThreadsWidth + deltaX);
        threadsWidth.current = newWidth;
        container.style.gridTemplateColumns = `${mailboxWidth.current}px 12px ${newWidth}px 12px 1fr`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  return (
    <div className="ft-email">
      {/* ─────────────────────────────────────────────────────────────
          HEADER BAR
          ───────────────────────────────────────────────────────────── */}
      <header className="ft-email__header">
        <T.body>Header</T.body>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          THREE-RAIL LAYOUT (with resize handles)
          ───────────────────────────────────────────────────────────── */}
      <div
        className="ft-email__body"
        ref={containerRef}
      >
        {/* RAIL 1: Mailbox */}
        <aside className="ft-email__mailbox">
          <div
            className={`ft-email__folder ${selectedFolder === 'inbox' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('inbox')}
          >
            <span className="ft-email__folder-icon">📥</span>
            <span className="ft-email__folder-label">Inbox</span>
            {folderCounts.inbox > 0 && (
              <span className="ft-email__folder-count">{folderCounts.inbox}</span>
            )}
          </div>
          <div
            className={`ft-email__folder ${selectedFolder === 'drafts' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('drafts')}
          >
            <span className="ft-email__folder-icon">📝</span>
            <span className="ft-email__folder-label">Drafts</span>
          </div>
          <div
            className={`ft-email__folder ${selectedFolder === 'sent' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('sent')}
          >
            <span className="ft-email__folder-icon">📤</span>
            <span className="ft-email__folder-label">Sent</span>
            {folderCounts.sent > 0 && (
              <span className="ft-email__folder-count">{folderCounts.sent}</span>
            )}
          </div>
          <div
            className={`ft-email__folder ${selectedFolder === 'archive' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('archive')}
          >
            <span className="ft-email__folder-icon">📦</span>
            <span className="ft-email__folder-label">Archive</span>
          </div>
          <div
            className={`ft-email__folder ${selectedFolder === 'trash' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('trash')}
          >
            <span className="ft-email__folder-icon">🗑️</span>
            <span className="ft-email__folder-label">Trash</span>
          </div>
          <div
            className={`ft-email__folder ${selectedFolder === 'junk' ? 'ft-email__folder--selected' : ''}`}
            onClick={() => setSelectedFolder('junk')}
          >
            <span className="ft-email__folder-icon">⚠️</span>
            <span className="ft-email__folder-label">Junk</span>
          </div>
        </aside>

        {/* RESIZE HANDLE 1: Between Mailbox and Threads */}
        <div
          className="ft-email__resize-handle"
          onMouseDown={(e) => handleResize('mailbox', e)}
        />

        {/* RAIL 2: Thread List */}
        <section className="ft-email__threads">
          <div className="ft-email__threads-scroll">
            {!flags.isHydrated ? (
              <div className="ft-email__loading"><T.body color="secondary">Loading...</T.body></div>
            ) : threads.length === 0 ? (
              <div className="ft-email__empty"><T.body color="secondary">No emails yet</T.body></div>
            ) : (
              threads.map((thread, index) => {
                const bucket = getTimeBucket(thread.latestMessageAt);
                const prevBucket = index > 0 ? getTimeBucket(threads[index - 1].latestMessageAt) : null;
                const showHeader = bucket !== prevBucket;
                const isCollapsed = collapsedSections.has(bucket);

                return (
                  <div key={thread.threadId}>
                    {showHeader && (
                      <div
                        className="ft-email__section-header"
                        onClick={() => toggleSection(bucket)}
                      >
                        <span>{bucket}</span>
                        <span className={`ft-email__section-chevron ${isCollapsed ? 'ft-email__section-chevron--collapsed' : ''}`}>
                          ›
                        </span>
                      </div>
                    )}
                    {!isCollapsed && (
                      <div
                        className={`ft-email__thread-item ${selectedThreadId === thread.threadId ? 'ft-email__thread-item--selected' : ''} ${thread.hasUnread ? 'ft-email__thread-item--unread' : ''}`}
                        onClick={() => setSelectedThreadId(thread.threadId)}
                      >
                        <div className="ft-email__thread-top">
                          <div className="ft-email__thread-sender">
                            {thread.latestFrom?.name || thread.latestFrom?.email || thread.participants[0]?.name || thread.participants[0]?.email || 'Unknown'}
                          </div>
                          <div className="ft-email__thread-date">
                            {formatThreadDate(thread.latestMessageAt)}
                          </div>
                        </div>
                        <div className="ft-email__thread-subject">{thread.subject}</div>
                        <div className="ft-email__thread-snippet">
                          {thread.messageCount > 1 ? `(${thread.messageCount}) ` : ''}{thread.snippet}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* RESIZE HANDLE 2: Between Threads and Reading */}
        <div
          className="ft-email__resize-handle"
          onMouseDown={(e) => handleResize('threads', e)}
        />

        {/* RAIL 3: Reading Pane */}
        <main className="ft-email__reading">
          <div className="ft-email__reading-scroll">
            {!selectedThreadId ? (
              <div className="ft-email__empty"><T.body color="secondary">Select a thread to read</T.body></div>
            ) : !flags.isHydrated ? (
              <div className="ft-email__loading"><T.body color="secondary">Loading...</T.body></div>
            ) : selectedThread === null ? (
              <div className="ft-email__empty"><T.body color="secondary">Thread not found</T.body></div>
            ) : (
              <>
                <div className="ft-email__reading-subject">{selectedThread.subject}</div>
                <div className="ft-email__reading-meta">
                  {selectedThread.participants.map(p => p.name || p.email).join(', ')}
                </div>
                <hr />
                <div className="ft-email__reading-messages">
                    {selectedThread.messages
                      .sort((a, b) => b.receivedAt - a.receivedAt) // Most recent first
                      .map((message, index) => (
                        <div key={message._id} className="ft-email__message">
                          <div className="ft-email__message-header">
                            <strong>From:</strong> {message.from.name || message.from.email}<br />
                            <strong>Date:</strong> {new Date(message.receivedAt).toLocaleString()}<br />
                            <strong>To:</strong> {message.to.map(r => r.name || r.email).join(', ')}
                          </div>
                          <div className="ft-email__message-snippet">{message.snippet}</div>
                          {index < selectedThread.messages.length - 1 && <hr />}
                        </div>
                      ))
                    }
                  </div>
              </>
            )}
          </div>{/* end reading-scroll */}
        </main>
      </div>
    </div>
  );
}
