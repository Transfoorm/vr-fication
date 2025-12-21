/**──────────────────────────────────────────────────────────────────────┐
│  📧 MESSAGE BODY - Center Panel Component                              │
│  /src/features/productivity/email-console/MessageBody.tsx              │
│                                                                        │
│  EMAIL UX DOCTRINE:                                                    │
│  - Transient display (changes on thread selection)                     │
│  - Full message chronology (conversation view)                         │
│  - Quick actions visible but secondary (Reply/Forward below)           │
│  - Emphasis on reading, not composing                                  │
│                                                                        │
│  Visual ref: Linear's issue view, Superhuman's message pane            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import './message-body.css';

export interface MessageBodyProps {
  threadId: string | null;
}

/**
 * 📧 MESSAGE BODY
 *
 * Center panel: Displays all messages in a thread chronologically.
 *
 * DOCTRINE:
 * - Renders from FUSE (thread data preloaded by WARP)
 * - 0ms perceived navigation (data already there)
 * - Chronological order (oldest → newest)
 * - Actions secondary (not primary)
 */
export function MessageBody({ threadId }: MessageBodyProps) {
  // FUSE access (email data preloaded by WARP)
  const email = useFuse((state) => state.productivity?.email);

  // Early return if no thread selected
  if (!threadId) {
    return (
      <div className="ft-message-body-empty">
        <div className="ft-message-body-empty__content">
          <T.body>Select a thread to view messages</T.body>
          <T.caption color="secondary" className="ft-message-body-empty__hint">
            Choose a thread from the inbox queue on the left
          </T.caption>
        </div>
      </div>
    );
  }

  // Find thread data from FUSE
  const thread = email?.threads?.find((t) => t.threadId === threadId);

  if (!thread) {
    return (
      <div className="ft-message-body-empty">
        <div className="ft-message-body-empty__content">
          <T.body>Thread not found</T.body>
          <T.caption color="secondary" className="ft-message-body-empty__hint">
            This thread may have been deleted or is no longer available
          </T.caption>
        </div>
      </div>
    );
  }

  // Get messages for this thread (sorted chronologically)
  const messages = email?.messages?.filter((m) => m.externalThreadId === threadId) || [];
  const sortedMessages = [...messages].sort((a, b) => a.receivedAt - b.receivedAt);

  return (
    <div className="ft-message-body">
      {/* Thread Header */}
      <div className="ft-message-body__header">
        <T.title size="lg" className="ft-message-body__subject">{thread.subject}</T.title>
        <T.caption color="secondary" className="ft-message-body__participants">
          {thread.participants
            .map((p) => p.name || p.email.split('@')[0])
            .join(', ')}
        </T.caption>
      </div>

      {/* Message List */}
      <div className="ft-message-body__messages">
        {sortedMessages.length === 0 ? (
          <div className="ft-message-body-empty__content">
            <T.body>No messages in this thread</T.body>
          </div>
        ) : (
          sortedMessages.map(message => (
            <div
              key={message._id}
              className={`ft-message-item ${
                message.resolutionState === 'awaiting_me' ? 'ft-message-item--urgent' : ''
              }`}
            >
              {/* Message Header */}
              <div className="ft-message-item__header">
                <div className="ft-message-item__from">
                  <span className="ft-message-item__from-name">
                    {message.from.name || message.from.email.split('@')[0]}
                  </span>
                  <span className="ft-message-item__from-email">
                    &lt;{message.from.email}&gt;
                  </span>
                </div>
                <div className="ft-message-item__date">
                  {new Date(message.receivedAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Message Recipients */}
              <div className="ft-message-item__recipients">
                <T.caption className="ft-message-item__recipients-label">To:</T.caption>
                <T.caption>{message.to.map((recipient) => recipient.name || recipient.email).join(', ')}</T.caption>
              </div>

              {/* Message Body */}
              <div className="ft-message-item__body">
                <T.body size="md">{message.snippet || '(No content preview available)'}</T.body>
              </div>

              {/* Message Attachments */}
              {message.hasAttachments && (
                <div className="ft-message-item__attachments">
                  <T.caption size="sm">📎 This message has attachments</T.caption>
                </div>
              )}

              {/* Resolution State Badge */}
              <div className={`ft-message-item__state ft-message-item__state--${message.resolutionState.replace(/_/g, '-')}`}>
                {message.resolutionState === 'awaiting_me' && <T.caption size="xs" weight="medium">Awaiting Me</T.caption>}
                {message.resolutionState === 'awaiting_them' && <T.caption size="xs" weight="medium">Awaiting Them</T.caption>}
                {message.resolutionState === 'resolved' && <T.caption size="xs" weight="medium">Resolved</T.caption>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="ft-message-body__actions">
        <button className="ft-message-action ft-message-action--secondary">
          Reply
        </button>
        <button className="ft-message-action ft-message-action--secondary">
          Forward
        </button>
      </div>
    </div>
  );
}
