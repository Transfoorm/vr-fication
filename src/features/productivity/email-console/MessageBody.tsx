'use client';

/**──────────────────────────────────────────────────────────────────────┐
│  MESSAGE BODY - Displays email HTML content (Pure FUSE Reader)        │
│  /src/features/productivity/email-console/MessageBody.tsx             │
│                                                                        │
│  TTTS-7 COMPLIANT: Pure reader component.                             │
│  - Calls sync hook to trigger hydration                               │
│  - Reads HTML from FUSE store                                         │
│  - Renders inline with dangerouslySetInnerHTML                        │
│                                                                        │
│  Outlook Desktop Quality Target:                                       │
│  - Inline HTML rendering (no iframe)                                  │
│  - Single scroll surface                                              │
│  - Native layout flow                                                 │
│  - Provider quirks preserved (tables, inline styles, legacy markup)   │
└────────────────────────────────────────────────────────────────────────*/

import { useEmailBodySync } from '@/hooks/useEmailBodySync';
import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import type { Id } from '@/convex/_generated/dataModel';

interface MessageBodyProps {
  messageId: Id<'productivity_email_Index'>;
}

/**
 * MessageBody - Displays full email HTML content
 *
 * Pure FUSE reader. Triggers sync hook, reads from store.
 * Renders inline with dangerouslySetInnerHTML for Outlook-quality UX.
 */
export function MessageBody({ messageId }: MessageBodyProps) {
  // Trigger sync hook (hydrates into FUSE)
  useEmailBodySync(messageId);

  // Read from FUSE (with null safety for hydration)
  const htmlContent = useFuse((state) => state.productivity.emailBodies?.[messageId]);

  // Loading state (not yet hydrated)
  if (!htmlContent) {
    return (
      <div className="ft-email__body-loading">
        <T.body color="secondary">Loading email content...</T.body>
      </div>
    );
  }

  // Render HTML inline - same DOM, single scroll surface
  return (
    <div
      className="ft-email__message-body"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
