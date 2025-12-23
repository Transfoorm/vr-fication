/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL CONSOLE FEATURE - Dual-Mode Email Interface                  │
│  /src/features/productivity/email-console/index.tsx                    │
│                                                                        │
│  FEATURE LAYER (DIRTY): FUSE wiring + business logic                   │
│  Domain layer will import this as clean component                      │
│                                                                        │
│  DUAL-MODE SYSTEM (Same data, different action grammars):              │
│  - Live Mode: Traditional Outlook-style (trust + familiarity)          │
│  - Impact Mode: Three-pane triage console (outcomes + agency)          │
│                                                                        │
│  DOCTRINE:                                                             │
│  - Live mode optimizes for trust                                       │
│  - Impact mode optimizes for outcomes                                  │
│  - Both operate on the same email reality                              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSearchParams } from 'next/navigation';
import { useFuse } from '@/store/fuse';
import { T } from '@/vr';
import { LiveView } from './_live/LiveView';
import { ImpactView } from './_impact/ImpactView';
import './email-console.css';

export interface EmailConsoleProps {
  /** Optional initial thread ID to open */
  initialThreadId?: string;
}

/**
 * Email Console - Dual-mode email interface
 *
 * LIVE MODE (default): Traditional two-rail email for reading/replying
 * - Trust + Familiarity
 * - Standard email affordances
 * - No pressure to "act"
 *
 * IMPACT MODE (power tool): Three-rail triage interface for inbox processing
 * - Outcomes + Agency
 * - Big 3 Actions: Promote, Link, Resolve
 * - AI suggests, humans commit
 *
 * Toggle between modes with header button.
 * View preference persisted in FUSE store.
 */
export function EmailConsole({ initialThreadId }: EmailConsoleProps) {
  // FUSE store access (email data + view mode preference)
  const email = useFuse((state) => state.productivity?.email);
  const viewMode = useFuse((state) => state.productivity?.emailViewMode || 'live');
  const setEmailViewMode = useFuse((state) => state.setEmailViewMode);

  // Check for OAuth errors in URL
  const searchParams = useSearchParams();
  const outlookError = searchParams.get('outlook_error');

  // Early return if no email data loaded
  if (!email) {
    return (
      <div className="ft-email-console-empty">
        <div className="ft-email-console-empty__content">
          <T.h3>Connect Your Email</T.h3>
          <T.body color="secondary" size="md">
            Connect your Outlook account to start managing your inbox.
          </T.body>

          {/* Error message if OAuth failed */}
          {outlookError && (
            <div className="ft-email-console-error">
              <T.body color="error" weight="medium">
                Connection failed: {outlookError.replace(/_/g, ' ')}
              </T.body>
              <T.caption color="tertiary" size="sm">
                Please try again or check your Microsoft account settings
              </T.caption>
            </div>
          )}

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
    const newMode = viewMode === 'live' ? 'impact' : 'live';
    setEmailViewMode(newMode);
  };

  return (
    <>
      {/* Header with View Toggle */}
      <div className="ft-email-console-header">
        <div className="ft-email-console-header__title">
          <T.h3>
            {viewMode === 'live' ? 'Live' : 'Impact'}
          </T.h3>
          <T.caption color="tertiary">
            {viewMode === 'live'
              ? 'Traditional email interface'
              : 'Turn email into outcomes'}
          </T.caption>
        </div>

        <button
          className={`ft-email-view-toggle ${
            viewMode === 'impact' ? 'ft-email-view-toggle--active' : ''
          }`}
          onClick={toggleViewMode}
        >
          <T.body weight="medium">
            {viewMode === 'live' ? 'Enter Impact Mode' : 'Exit to Live'}
          </T.body>
        </button>
      </div>

      {/* Conditional View Rendering */}
      {viewMode === 'live' ? (
        <LiveView initialThreadId={initialThreadId} />
      ) : (
        <ImpactView initialThreadId={initialThreadId} />
      )}
    </>
  );
}
