/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL CONSOLE FEATURE - Three-Rail Layout                          │
│  /src/features/productivity/email-console/index.tsx                    │
│                                                                        │
│  FEATURE LAYER (DIRTY): FUSE wiring + business logic                   │
│  Domain layer will import this as clean component                      │
│                                                                        │
│  EMAIL UX DOCTRINE:                                                    │
│  - NOT a Gmail/Outlook clone                                           │
│  - Three zones: Queue (left) + Message (center) + Intelligence (right) │
│  - Inbox is work queue, not storage                                    │
│  - Actions inverted: Resolve/Promote primary, Reply secondary          │
│                                                                        │
│  See: /docs/EMAIL_UX_DOCTRINE.md                                       │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import { InboxQueue } from './InboxQueue';
import { MessageBody } from './MessageBody';
import { IntelligenceRail } from './IntelligenceRail';
import './email-console.css';

export interface EmailConsoleProps {
  /** Optional initial thread ID to open */
  initialThreadId?: string;
}

/**
 * 📧 EMAIL CONSOLE
 *
 * Three-rail email intake interface.
 * NOT a Gmail clone - optimized for processing, not reading.
 *
 * LAYOUT:
 * - Left (30%): Inbox queue (thread list filtered by state)
 * - Center (45%): Message body (current thread messages)
 * - Right (25%): Intelligence rail (AI suggestions, actions)
 *
 * DOCTRINE:
 * - <50ms render target (WARP preloads thread list)
 * - 0ms perceived navigation (thread data in FUSE)
 * - Thread state derived on-the-fly (not stored)
 * - Humans commit state changes (AI suggests only)
 */
export function EmailConsole({ initialThreadId }: EmailConsoleProps) {
  // Selected thread state (client-side only)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId || null
  );

  // FUSE store access (email data preloaded by WARP)
  const email = useFuse((state) => state.productivity?.email);

  // Early return if no email data loaded
  if (!email) {
    return (
      <div className="ft-email-console-loading">
        <T.body>Loading email data...</T.body>
      </div>
    );
  }

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
        <MessageBody
          threadId={selectedThreadId}
        />
      </div>

      {/* RIGHT RAIL: Intelligence & Actions (25%) */}
      <div className="ft-email-console__intelligence">
        <IntelligenceRail
          threadId={selectedThreadId}
        />
      </div>
    </div>
  );
}
