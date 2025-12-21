/**──────────────────────────────────────────────────────────────────────┐
│  📬 INBOX QUEUE - Left Rail Component                                  │
│  /src/features/productivity/email-console/InboxQueue.tsx               │
│                                                                        │
│  EMAIL UX DOCTRINE:                                                    │
│  - Work queue, NOT storage folder                                      │
│  - High density (see more threads, scroll less)                        │
│  - Strong state indicators (awaiting-me = bold + orange)               │
│  - Flat list (no nested hierarchy obsession)                           │
│                                                                        │
│  Visual ref: Linear's issue list, Notion's database view               │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { useState } from 'react';
import { T } from '@/vr';
import type { EmailThread } from './types';
import './inbox-queue.css';

export interface InboxQueueProps {
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

type StateFilter = 'all' | 'awaiting_me' | 'awaiting_them' | 'resolved' | 'none';

/**
 * 📬 INBOX QUEUE
 *
 * Left rail: Thread list with state filtering.
 *
 * DOCTRINE:
 * - Renders from FUSE (WARP preloaded)
 * - <50ms render target
 * - Thread state derived on-the-fly
 * - Click = select thread (0ms perceived, data in FUSE)
 */
export function InboxQueue({ selectedThreadId, onThreadSelect }: InboxQueueProps) {
  const [stateFilter, setStateFilter] = useState<StateFilter>('awaiting_me');

  // FUSE access (threads preloaded by WARP)
  const threads = (useFuse((state) => state.productivity?.email?.threads) || []) as EmailThread[];

  // Filter threads by state
  const filteredThreads = threads.filter((thread) => {
    if (stateFilter === 'all') return true;
    return thread.state === stateFilter;
  });

  return (
    <div className="ft-inbox-queue">
      {/* State Filter Tabs */}
      <div className="ft-inbox-queue__filters">
        <button
          className={`ft-inbox-filter ${stateFilter === 'awaiting_me' ? 'ft-inbox-filter--active' : ''}`}
          onClick={() => setStateFilter('awaiting_me')}
        >
          Awaiting Me ({threads.filter((t) => t.state === 'awaiting_me').length})
        </button>
        <button
          className={`ft-inbox-filter ${stateFilter === 'awaiting_them' ? 'ft-inbox-filter--active' : ''}`}
          onClick={() => setStateFilter('awaiting_them')}
        >
          Awaiting Them ({threads.filter((t) => t.state === 'awaiting_them').length})
        </button>
        <button
          className={`ft-inbox-filter ${stateFilter === 'resolved' ? 'ft-inbox-filter--active' : ''}`}
          onClick={() => setStateFilter('resolved')}
        >
          Resolved ({threads.filter((t) => t.state === 'resolved').length})
        </button>
        <button
          className={`ft-inbox-filter ${stateFilter === 'all' ? 'ft-inbox-filter--active' : ''}`}
          onClick={() => setStateFilter('all')}
        >
          All ({threads.length})
        </button>
      </div>

      {/* Thread List */}
      <div className="ft-inbox-queue__list">
        {filteredThreads.length === 0 ? (
          <div className="ft-inbox-queue__empty">
            <T.body>No threads {stateFilter !== 'all' && `in "${stateFilter}"`}</T.body>
            <T.caption color="secondary" className="ft-inbox-queue__empty-hint">
              {stateFilter === 'awaiting_me' && 'Great! All caught up.'}
              {stateFilter === 'awaiting_them' && 'No pending responses.'}
              {stateFilter === 'resolved' && 'No resolved threads yet.'}
            </T.caption>
          </div>
        ) : (
          filteredThreads.map(thread => (
            <div
              key={thread.threadId}
              className={`ft-inbox-thread ${
                selectedThreadId === thread.threadId ? 'ft-inbox-thread--selected' : ''
              } ${
                thread.state === 'awaiting_me' ? 'ft-inbox-thread--urgent' : ''
              }`}
              onClick={() => onThreadSelect(thread.threadId)}
            >
              {/* State Badge */}
              <div className={`ft-inbox-thread__state ft-inbox-thread__state--${thread.state.replace(/_/g, '-')}`}>
                {thread.state === 'awaiting_me' && '●'}
                {thread.state === 'awaiting_them' && '○'}
                {thread.state === 'resolved' && '✓'}
              </div>

              {/* Thread Content */}
              <div className="ft-inbox-thread__content">
                {/* Participants */}
                <div className="ft-inbox-thread__participants">
                  {thread.participants
                    .slice(0, 3)
                    .map((p) => p.name || p.email.split('@')[0])
                    .join(', ')}
                  {thread.participants.length > 3 && ` +${thread.participants.length - 3}`}
                </div>

                {/* Subject */}
                <div className="ft-inbox-thread__subject">
                  {thread.subject}
                </div>

                {/* Metadata */}
                <div className="ft-inbox-thread__meta">
                  {thread.messageCount} {thread.messageCount === 1 ? 'message' : 'messages'}
                  {' · '}
                  {new Date(thread.latestMessageAt).toLocaleDateString()}
                </div>
              </div>

              {/* Unread Indicator */}
              {thread.hasUnread && (
                <div className="ft-inbox-thread__unread" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
