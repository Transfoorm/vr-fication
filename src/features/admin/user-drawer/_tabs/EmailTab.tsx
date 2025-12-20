/**──────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL TAB                                                         │
│  /src/features/admin/user-drawer/_tabs/EmailTab.tsx                   │
│                                                                       │
│  Admin email management:                                              │
│  - View user's primary email (read-only)                              │
│  - Send password recovery link to any email via Field.verify pill     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../user-drawer.css';
import { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Field, T } from '@/vr';
import { sendRecoveryLink } from '@/app/(clerk)/actions/recovery';

interface EmailTabProps {
  userId: string;
}

export function EmailTab({ userId }: EmailTabProps) {
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);

  // Track success state for helper message
  const [lastSentTo, setLastSentTo] = useState<string | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasCopied, setHasCopied] = useState(false); // Tracks if link was ever copied

  if (!user) return <div><T.body>User not found</T.body></div>;

  // Placeholder save - never actually called since field is disabled
  const noOpSave = async () => {};

  const handleSendRecovery = async (email: string) => {
    const result = await sendRecoveryLink(userId, email);

    if (result.error) {
      throw new Error(result.error);
    }

    // Show success message and link (stays until next send)
    setLastSentTo(email);
    setMagicLink(result.magicLink || null);
    setCopied(false);
    setHasCopied(false);
  };

  // Helper text changes based on state
  const helperText = lastSentTo
    ? `✓ Recovery link sent to: ${lastSentTo}`
    : 'Type an email the user wants a recovery link sent to, and send it!';

  const handleCopyLink = async () => {
    if (magicLink) {
      await navigator.clipboard.writeText(magicLink);
      setCopied(true);
      setHasCopied(true);
      // Show "Copied!" for 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClear = () => {
    setLastSentTo(null);
    setMagicLink(null);
    setCopied(false);
    setHasCopied(false);
  };

  // Button shows: Copy → Copied! → Clear (after copied)
  const getButtonText = () => {
    if (copied) return 'Copied!';
    if (hasCopied) return 'Clear';
    return 'Copy';
  };

  const handleButtonClick = () => {
    if (copied) return; // Do nothing while showing "Copied!"
    if (hasCopied) {
      handleClear();
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="ft-emailtab">
      <div className="vr-field-spacing">
        {/* Row 1: Primary + Secondary email - read only */}
        <div className="vr-field-row">
          <Field.live
            label="Primary Email"
            value={String(user.email ?? '')}
            onSave={noOpSave}
            placeholder="No email"
            disabled
          />
          <Field.live
            label="Secondary Email"
            value=""
            onSave={noOpSave}
            placeholder="Not set"
            disabled
          />
        </div>

        {/* Magic Link Recovery Section */}
        <div className="ft-emailtab__recovery-section">
          <T.h4 className="ft-emailtab__recovery-header">Magic Link Recovery</T.h4>
          <div className="vr-field-row">
            <div className={lastSentTo ? 'ft-emailtab__recovery--success' : ''}>
              <Field.verify
                label="Send a Recovery Link to the user's email"
                value=""
                onCommit={handleSendRecovery}
                type="email"
                placeholder="Enter any email address"
                helper={helperText}
                variant="send"
              />
            </div>
            <div />
          </div>

          {/* Magic link display - always visible to prevent layout shift */}
          <div className="ft-emailtab__magic-link">
            <T.caption className="ft-emailtab__magic-link-label">Recovery Link (expires in 24 hours):</T.caption>
            <div className="ft-emailtab__magic-link-row">
              <input
                type="text"
                value={magicLink || ''}
                readOnly
                placeholder="Generate a link above"
                className="ft-emailtab__magic-link-input"
              />
              <button
                type="button"
                onClick={handleButtonClick}
                disabled={!magicLink && !hasCopied}
                className={`ft-emailtab__copy-btn ${copied ? 'ft-emailtab__copy-btn--copied' : ''} ${hasCopied && !copied ? 'ft-emailtab__copy-btn--clear' : ''}`}
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
