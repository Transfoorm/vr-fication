/**──────────────────────────────────────────────────────────────────────┐
│  📧 STANDARD EMAIL VIEW - Two-Rail Layout                              │
│  /src/features/productivity/email-console/StandardEmailView.tsx       │
│                                                                        │
│  Traditional email interface (like Gmail/Outlook)                      │
│  Two zones: Thread List (35%) + Reading Pane (65%)                    │
│                                                                        │
│  USE CASE: Normal email reading and replying                          │
│  Switch to Await View for inbox triage and processing                 │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import type { EmailThread, EmailMessage } from './types';
import './standard-email-view.css';

export interface StandardEmailViewProps {
  /** Initial thread to select */
  initialThreadId?: string | null;
}

/**
 * StandardEmailView - Traditional two-rail email interface
 *
 * LEFT (35%): Thread list with subject/sender/time
 * RIGHT (65%): Reading pane with message content + reply button
 */
export function StandardEmailView({ initialThreadId }: StandardEmailViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null
  );

  // FUSE store access
  const email = useFuse((state) => state.productivity?.email);
  const threads = (email?.threads || []) as EmailThread[];
  const messages = (email?.messages || []) as EmailMessage[];

  // Get messages for selected thread
  const selectedMessages = selectedThreadId
    ? messages.filter((msg) => msg.externalThreadId === selectedThreadId)
    : [];

  const selectedThread = threads.find((t) => t.threadId === selectedThreadId);

  return (
    <div className="ft-standard-email">
      {/* LEFT: Thread List (35%) */}
      <div className="ft-standard-email__list">
        <div className="ft-standard-email__list-header">
          <T.h3>Inbox</T.h3>
          <T.caption color="tertiary">{threads.length} threads</T.caption>
        </div>

        <div className="ft-standard-email__threads">
          {threads.length === 0 ? (
            <div className="ft-standard-email__empty">
              <T.body color="tertiary">No emails yet</T.body>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.threadId}
                className={`ft-standard-thread ${
                  thread.threadId === selectedThreadId ? 'ft-standard-thread--selected' : ''
                } ${thread.hasUnread ? 'ft-standard-thread--unread' : ''}`}
                onClick={() => setSelectedThreadId(thread.threadId)}
              >
                <div className="ft-standard-thread__header">
                  <T.body
                    size="md"
                    weight={thread.hasUnread ? 'semibold' : 'normal'}
                    className="ft-standard-thread__sender"
                  >
                    {thread.participants.map((p) => p.name || p.email).join(', ')}
                  </T.body>
                  <T.caption size="sm" color="tertiary">
                    {new Date(thread.latestMessageAt).toLocaleDateString()}
                  </T.caption>
                </div>

                <T.body
                  size="md"
                  weight={thread.hasUnread ? 'medium' : 'normal'}
                  className="ft-standard-thread__subject"
                >
                  {thread.subject}
                </T.body>

                <T.caption size="sm" color="secondary" className="ft-standard-thread__preview">
                  {messages.find((m) => m.externalThreadId === thread.threadId)?.snippet || ''}
                </T.caption>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Reading Pane (65%) */}
      <div className="ft-standard-email__reading">
        {!selectedThreadId ? (
          <div className="ft-standard-email__no-selection">
            <T.body color="tertiary">Select a thread to read</T.body>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="ft-standard-reading__header">
              <T.h2>{selectedThread?.subject}</T.h2>
              <T.caption color="secondary">
                {selectedThread?.messageCount} message
                {selectedThread?.messageCount !== 1 ? 's' : ''}
              </T.caption>
            </div>

            {/* Messages */}
            <div className="ft-standard-reading__messages">
              {selectedMessages.map((message) => (
                <div key={message._id} className="ft-standard-message">
                  <div className="ft-standard-message__header">
                    <div className="ft-standard-message__from">
                      <T.body weight="semibold">
                        {message.from.name || message.from.email}
                      </T.body>
                      <T.caption color="tertiary" size="sm">
                        {message.from.email}
                      </T.caption>
                    </div>
                    <T.caption color="tertiary">
                      {new Date(message.receivedAt).toLocaleString()}
                    </T.caption>
                  </div>

                  <div className="ft-standard-message__recipients">
                    <T.caption color="secondary">
                      To: {message.to.map((r) => r.name || r.email).join(', ')}
                    </T.caption>
                  </div>

                  <div className="ft-standard-message__body">
                    <T.body>{message.snippet}</T.body>
                  </div>

                  {message.hasAttachments && (
                    <div className="ft-standard-message__attachments">
                      <T.caption color="secondary">📎 Has attachments</T.caption>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Actions */}
            <div className="ft-standard-reading__actions">
              <button className="ft-standard-action ft-standard-action--primary">
                <T.body weight="medium">Reply</T.body>
              </button>
              <button className="ft-standard-action">
                <T.body>Reply All</T.body>
              </button>
              <button className="ft-standard-action">
                <T.body>Forward</T.body>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
