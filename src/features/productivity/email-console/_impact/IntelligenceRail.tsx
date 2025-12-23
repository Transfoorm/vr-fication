/**──────────────────────────────────────────────────────────────────────┐
│  🧠 INTELLIGENCE RAIL - Right Panel Component                         │
│  /src/features/productivity/email-console/_impact/IntelligenceRail.tsx│
│                                                                        │
│  EMAIL DOCTRINE:                                                       │
│  - AI suggests, humans commit (STATE OWNERSHIP BOUNDARY)               │
│  - Big 3 Actions PRIMARY: Promote, Link, Resolve                      │
│  - Reply actions SECONDARY (below, smaller)                            │
│  - Structured, system-like (not conversational)                        │
│  - Thread state, AI insights, linked objects, temporal data           │
│                                                                        │
│  Visual ref: Linear's sidebar actions, Superhuman's command bar        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { T } from '@/vr';

export interface IntelligenceRailProps {
  threadId: string | null;
}

/**
 * Intelligence Rail - AI insights + primary actions (Big 3: Promote, Link, Resolve)
 *
 * DOCTRINE:
 * - Renders from FUSE (AI classification preloaded)
 * - Actions are suggestions (humans execute)
 * - Promotion to outcomes PRIMARY (not Reply)
 * - Thread state management visible + fast
 */
export function IntelligenceRail({ threadId }: IntelligenceRailProps) {
  // FUSE access (email data + AI classifications preloaded by WARP)
  const email = useFuse((state) => state.productivity?.email);

  // Early return if no thread selected
  if (!threadId) {
    return (
      <div className="ft-intelligence-empty">
        <div className="ft-intelligence-empty__content">
          <T.body>No thread selected</T.body>
          <T.caption color="secondary" className="ft-intelligence-empty__hint">
            Select a thread to see AI insights and actions
          </T.caption>
        </div>
      </div>
    );
  }

  // Find thread data from FUSE
  const thread = email?.threads?.find((t) => t.threadId === threadId);

  if (!thread) {
    return (
      <div className="ft-intelligence-empty">
        <div className="ft-intelligence-empty__content">
          <T.body>Thread not found</T.body>
        </div>
      </div>
    );
  }

  // Get latest message for AI classification
  const messages = email?.messages?.filter((m) => m.externalThreadId === threadId) || [];
  const latestMessage = messages.sort((a, b) => b.receivedAt - a.receivedAt)[0];
  const aiClassification = latestMessage?.aiClassification;

  return (
    <div className="ft-intelligence-rail">
      {/* BIG 3 ACTION #3: RESOLVE - Primary Thread Action */}
      <div className="ft-intelligence-rail__section">
        <T.caption weight="medium" className="ft-intelligence-rail__section-title">Resolve</T.caption>
        <div className="ft-intelligence-rail__actions-primary">
          <button className="ft-ir-action ft-ir-action--primary ft-ir-action--resolve">
            Resolve Thread
          </button>
          {thread.state === 'resolved' && (
            <button className="ft-ir-action ft-ir-action--secondary">
              Reopen Thread
            </button>
          )}
          {thread.state !== 'awaiting_me' && (
            <button className="ft-ir-action ft-ir-action--secondary">
              Mark Awaiting Me
            </button>
          )}
        </div>
      </div>

      {/* BIG 3 ACTION #1: PROMOTE - Primary Outcomes */}
      <div className="ft-intelligence-rail__section">
        <T.caption weight="medium" className="ft-intelligence-rail__section-title">Promote</T.caption>
        <div className="ft-intelligence-rail__promotions">
          <button className="ft-ir-promotion ft-ir-promotion--primary">
            <span className="ft-ir-promotion__label">Promote to Task</span>
          </button>
          <button className="ft-ir-promotion">
            <span className="ft-ir-promotion__label">Promote to Calendar</span>
          </button>
          <button className="ft-ir-promotion">
            <span className="ft-ir-promotion__label">Promote to Pipeline</span>
          </button>
          <button className="ft-ir-promotion">
            <span className="ft-ir-promotion__label">Promote to Note</span>
          </button>
        </div>
      </div>

      {/* BIG 3 ACTION #2: LINK - Context Association */}
      <div className="ft-intelligence-rail__section">
        <T.caption weight="medium" className="ft-intelligence-rail__section-title">Link</T.caption>
        <div className="ft-intelligence-rail__links">
          <button className="ft-ir-link ft-ir-link--primary">
            <span className="ft-ir-link__label">Link to Project</span>
          </button>
          <button className="ft-ir-link">
            <span className="ft-ir-link__label">Create New Project</span>
          </button>
          <button className="ft-ir-link">
            <span className="ft-ir-link__label">Pin to Timeline</span>
          </button>
          <button className="ft-ir-link">
            <span className="ft-ir-link__label">Reference Only</span>
          </button>
        </div>
      </div>

      {/* AI CLASSIFICATION - Insights Section */}
      {aiClassification && (
        <div className="ft-intelligence-rail__section">
          <T.caption weight="medium" className="ft-intelligence-rail__section-title">AI Insights</T.caption>
          <div className="ft-intelligence-rail__insights">
            {aiClassification.intent && (
              <div className="ft-ir-insight">
                <div className="ft-ir-insight__label"><T.caption size="xs" weight="medium">Intent</T.caption></div>
                <div className="ft-ir-insight__value">
                  <T.caption size="sm">{aiClassification.intent.replace('_', ' ')}</T.caption>
                </div>
              </div>
            )}
            {aiClassification.priority && (
              <div className="ft-ir-insight">
                <div className="ft-ir-insight__label"><T.caption size="xs" weight="medium">Priority</T.caption></div>
                <div className={`ft-ir-insight__value ft-ir-insight__value--${aiClassification.priority}`}>
                  <T.caption size="sm">{aiClassification.priority}</T.caption>
                </div>
              </div>
            )}
            {aiClassification.senderType && (
              <div className="ft-ir-insight">
                <div className="ft-ir-insight__label"><T.caption size="xs" weight="medium">Sender Type</T.caption></div>
                <div className="ft-ir-insight__value">
                  <T.caption size="sm">{aiClassification.senderType.replace('_', ' ')}</T.caption>
                </div>
              </div>
            )}
            {aiClassification.explanation && (
              <div className="ft-ir-insight ft-ir-insight--full">
                <div className="ft-ir-insight__label"><T.caption size="xs" weight="medium">Analysis</T.caption></div>
                <div className="ft-ir-insight__explanation">
                  <T.caption size="sm">{aiClassification.explanation}</T.caption>
                </div>
              </div>
            )}
            {aiClassification.confidence !== undefined && (
              <div className="ft-ir-insight__confidence">
                <T.caption size="xs">AI Confidence: {Math.round(aiClassification.confidence * 100)}%</T.caption>
              </div>
            )}
          </div>
        </div>
      )}

      {/* THREAD METADATA - Context Section */}
      <div className="ft-intelligence-rail__section">
        <T.caption weight="medium" className="ft-intelligence-rail__section-title">Thread Info</T.caption>
        <div className="ft-intelligence-rail__metadata">
          <div className="ft-ir-meta-item">
            <div className="ft-ir-meta-item__label"><T.caption size="xs" weight="medium">Participants</T.caption></div>
            <div className="ft-ir-meta-item__value">
              <T.caption size="sm">
                {thread.participants
                  .map((p) => p.name || p.email.split('@')[0])
                  .join(', ')}
              </T.caption>
            </div>
          </div>
          <div className="ft-ir-meta-item">
            <div className="ft-ir-meta-item__label"><T.caption size="xs" weight="medium">Messages</T.caption></div>
            <div className="ft-ir-meta-item__value">
              <T.caption size="sm">{thread.messageCount}</T.caption>
            </div>
          </div>
          <div className="ft-ir-meta-item">
            <div className="ft-ir-meta-item__label"><T.caption size="xs" weight="medium">Latest</T.caption></div>
            <div className="ft-ir-meta-item__value">
              <T.caption size="sm">
                {new Date(thread.latestMessageAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </T.caption>
            </div>
          </div>
          <div className="ft-ir-meta-item">
            <div className="ft-ir-meta-item__label"><T.caption size="xs" weight="medium">State</T.caption></div>
            <div className={`ft-ir-meta-item__value ft-ir-meta-item__value--${thread.state.replace(/_/g, '-')}`}>
              {thread.state === 'awaiting_me' && <T.caption size="sm">Awaiting Me</T.caption>}
              {thread.state === 'awaiting_them' && <T.caption size="sm">Awaiting Them</T.caption>}
              {thread.state === 'resolved' && <T.caption size="sm">Resolved</T.caption>}
              {thread.state === 'none' && <T.caption size="sm">None</T.caption>}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY ACTIONS - Bottom Section */}
      <div className="ft-intelligence-rail__section">
        <T.caption weight="medium" className="ft-intelligence-rail__section-title">More Actions</T.caption>
        <div className="ft-intelligence-rail__actions-secondary">
          <button className="ft-ir-action ft-ir-action--tertiary">
            Archive Thread
          </button>
          <button className="ft-ir-action ft-ir-action--tertiary">
            Mark as Spam
          </button>
        </div>
      </div>
    </div>
  );
}
