/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL CONSOLE FEATURE - Dual-Mode Email Interface                  │
│  /src/features/productivity/email-console/index.tsx                    │
│                                                                        │
│  FEATURE LAYER (DIRTY): FUSE wiring + business logic                   │
│  Domain layer will import this as clean component                      │
│                                                                        │
│  DUAL-MODE SYSTEM:                                                     │
│  - Standard View: Traditional two-rail email (default)                 │
│  - Await View: Three-rail triage interface (power tool)                │
│                                                                        │
│  Toggle between modes with "Await View" button in header              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import { StandardEmailView } from './StandardEmailView';
import { AwaitView } from './AwaitView';
import './email-console.css';
import './email-console-header.css';

export interface EmailConsoleProps {
  /** Optional initial thread ID to open */
  initialThreadId?: string;
}

/**
 * 📧 EMAIL CONSOLE
 *
 * Dual-mode email interface:
 * - STANDARD VIEW (default): Traditional two-rail email for reading/replying
 * - AWAIT VIEW (power tool): Three-rail triage interface for inbox processing
 *
 * Toggle between modes with header button
 * View preference persisted in FUSE store
 *
 * STANDARD VIEW:
 * - Left (35%): Thread list (traditional)
 * - Right (65%): Reading pane + reply buttons
 *
 * AWAIT VIEW:
 * - Left (30%): State-filtered queue
 * - Center (45%): Message thread
 * - Right (25%): AI insights + promotion actions
 */
export function EmailConsole({ initialThreadId }: EmailConsoleProps) {
  // FUSE store access (email data + view mode preference)
  const email = useFuse((state) => state.productivity?.email);
  const viewMode = useFuse((state) => state.productivity?.emailViewMode || 'standard');
  const setEmailViewMode = useFuse((state) => state.setEmailViewMode);

  // Early return if no email data loaded
  if (!email) {
    return (
      <div className="ft-email-console-empty">
        <div className="ft-email-console-empty__content">
          <T.h3>Connect Your Email</T.h3>
          <T.body color="secondary" size="md">
            Connect your Outlook account to start managing your inbox with Await View.
          </T.body>

          <a
            href="/api/auth/outlook/authorize"
            className="ft-email-console-connect-button"
          >
            <T.body weight="semibold">Connect Outlook</T.body>
          </a>

          <T.caption color="tertiary" size="sm">
            You&apos;ll be redirected to Microsoft to authorize access
          </T.caption>
        </div>
      </div>
    );
  }

  // Toggle between view modes (persists to FUSE)
  const toggleViewMode = () => {
    const newMode = viewMode === 'standard' ? 'await' : 'standard';
    setEmailViewMode(newMode);
  };

  return (
    <>
      {/* Header with View Toggle */}
      <div className="ft-email-console-header">
        <div className="ft-email-console-header__title">
          <T.h3>
            {viewMode === 'standard' ? 'Inbox' : 'Await View'}
          </T.h3>
          <T.caption color="tertiary">
            {viewMode === 'standard'
              ? 'Traditional email interface'
              : 'Inbox triage & processing'}
          </T.caption>
        </div>

        <button
          className={`ft-email-view-toggle ${
            viewMode === 'await' ? 'ft-email-view-toggle--active' : ''
          }`}
          onClick={toggleViewMode}
        >
          <T.body weight="medium">
            {viewMode === 'standard' ? '⚡ Enter Await View' : '← Exit Await View'}
          </T.body>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'standard' ? (
        <StandardEmailView initialThreadId={initialThreadId} />
      ) : (
        <AwaitView initialThreadId={initialThreadId} />
      )}
    </>
  );
}
