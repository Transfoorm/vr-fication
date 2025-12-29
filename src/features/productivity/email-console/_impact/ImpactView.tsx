/**──────────────────────────────────────────────────────────────────────┐
│  ⚡ IMPACT VIEW - Three-Rail Triage Interface                         │
│  /src/features/productivity/email-console/_impact/ImpactView.tsx      │
│                                                                        │
│  IMPACT MODE (Primary Differentiator): Turn email into outcomes       │
│  - Different action grammar on the same threads                        │
│  - Three-pane console layout                                           │
│  - Big 3 Actions: Promote, Link, Resolve                              │
│  - AI suggests, humans commit                                          │
│                                                                        │
│  Three zones: Queue (30%) + Conversation (45%) + Intelligence (25%)   │
│  Visual ref: Linear's issue view, Superhuman's command bar            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { ResolutionQueue } from './ResolutionQueue';
import { ConversationPane } from './ConversationPane';
import { IntelligenceRail } from './IntelligenceRail';

export interface ImpactViewProps {
  /** Initial thread to select */
  initialThreadId?: string | null;
}

/**
 * ImpactView - Three-rail triage interface for inbox processing
 *
 * LEFT (30%): Resolution Queue - State-filtered queue (awaiting me/them/resolved)
 * CENTER (45%): Conversation Pane - Message thread view (transient)
 * RIGHT (25%): Intelligence Rail - AI insights + promotion actions (primary)
 *
 * DOCTRINE: Impact mode optimizes for outcomes.
 */
export function ImpactView({ initialThreadId }: ImpactViewProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null
  );

  return (
    <div className="ft-impact-view">
      {/* LEFT RAIL: Resolution Queue (30%) */}
      <div className="ft-impact-view__queue">
        <ResolutionQueue
          selectedThreadId={selectedThreadId}
          onThreadSelect={setSelectedThreadId}
        />
      </div>

      {/* CENTER PANEL: Conversation Pane (45%) - Transient */}
      <div className="ft-impact-view__conversation">
        <ConversationPane threadId={selectedThreadId} />
      </div>

      {/* RIGHT RAIL: Intelligence Rail (25%) - Primary */}
      <div className="ft-impact-view__intelligence">
        <IntelligenceRail threadId={selectedThreadId} />
      </div>
    </div>
  );
}
