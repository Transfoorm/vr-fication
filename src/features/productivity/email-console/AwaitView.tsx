/**──────────────────────────────────────────────────────────────────────┐
│  ⚡ AWAIT VIEW - Three-Rail Triage Interface                           │
│  /src/features/productivity/email-console/AwaitView.tsx               │
│                                                                        │
│  Power tool for inbox-zero workflow                                   │
│  Three zones: Queue (30%) + Messages (45%) + Intelligence (25%)       │
│                                                                        │
│  USE CASE: Inbox triage and processing sessions                       │
│  Switch back to Standard View for normal email reading                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { InboxQueue } from './InboxQueue';
import { MessageBody } from './MessageBody';
import { IntelligenceRail } from './IntelligenceRail';

export interface AwaitViewProps {
  /** Initial thread to select */
  initialThreadId?: string | null;
}

/**
 * AwaitView - Three-rail triage interface for inbox processing
 *
 * LEFT (30%): State-filtered queue (awaiting me/them/resolved)
 * CENTER (45%): Message thread view
 * RIGHT (25%): AI insights + promotion actions
 */
export function AwaitView({ initialThreadId }: AwaitViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null
  );

  return (
    <div className="ft-email-console">
      {/* LEFT RAIL: Inbox Queue (30%) */}
      <div className="ft-email-console__queue">
        <InboxQueue
          selectedThreadId={selectedThreadId}
          onThreadSelect={setSelectedThreadId}
        />
      </div>

      {/* CENTER PANEL: Message Body (45%) */}
      <div className="ft-email-console__body">
        <MessageBody threadId={selectedThreadId} />
      </div>

      {/* RIGHT RAIL: Intelligence & Actions (25%) */}
      <div className="ft-email-console__intelligence">
        <IntelligenceRail threadId={selectedThreadId} />
      </div>
    </div>
  );
}
