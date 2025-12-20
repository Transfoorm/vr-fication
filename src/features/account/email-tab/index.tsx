/**──────────────────────────────────────────────────────────────────────┐
│  🔱 EMAIL FIELDS FEATURE                                              │
│  /src/features/account/EmailFields/index.tsx                          │
│                                                                       │
│  VR Doctrine: Feature Layer - THE DIRTY SLUT                          │
│  - Imports dumb VRs (Field.verify)                                    │
│  - Wires ALL the FUSE (user state, setUser)                           │
│  - Wires ALL the Convex (updateUserSettings)                          │
│  - Wires ALL the Server Actions (email-actions)                       │
│  - Orchestrates VerifyModal                                           │
│  - Handles email swap and removal                                     │
│  - Refreshes session cookies                                          │
│                                                                       │
│  The Bar Room Queen - takes all the dirt so others stay clean.        │
│                                                                       │
│  SOVEREIGNTY: Uses Server Actions for Clerk operations.               │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './email-tab.css';
import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import { Field, Card, T } from '@/prebuilts';
import { VerifyEmail } from '@/app/(clerk)/features/VerifyEmail';
import { VerifySecondary } from '@/app/(clerk)/features/VerifySecondary';
import { swapEmailsToPrimary, deleteSecondaryEmail } from '@/app/(clerk)/actions/email';
import { refreshSessionAfterUpload } from '@/app/actions/user-mutations';

type ActionState = 'idle' | 'confirming' | 'executing';

export function EmailFields() {
  // ─────────────────────────────────────────────────────────────────────
  // FUSE State (source of truth)
  // ─────────────────────────────────────────────────────────────────────
  const user = useFuse((s) => s.user);
  const primaryEmail = user?.email ?? '';
  const secondaryEmail = user?.secondaryEmail ?? '';

  // ─────────────────────────────────────────────────────────────────────
  // Convex Mutations
  // ─────────────────────────────────────────────────────────────────────
  const updateUserSettings = useMutation(api.domains.settings.mutations.updateUserSettings);

  // ─────────────────────────────────────────────────────────────────────
  // Modal State (for email verification)
  // ─────────────────────────────────────────────────────────────────────
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [pendingField, setPendingField] = useState<'email' | 'secondaryEmail' | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [modalResolver, setModalResolver] = useState<{
    resolve: () => void;
    reject: (error: Error) => void;
  } | null>(null);

  // ─────────────────────────────────────────────────────────────────────
  // Action States (for Make Primary / Remove)
  // ─────────────────────────────────────────────────────────────────────
  const [swapState, setSwapState] = useState<ActionState>('idle');
  const [removeState, setRemoveState] = useState<ActionState>('idle');

  // ─────────────────────────────────────────────────────────────────────
  // Email Commit Handler (triggers verification modal)
  // ─────────────────────────────────────────────────────────────────────

  const handleEmailCommit = useCallback(async (field: 'email' | 'secondaryEmail', newEmail: string) => {
    setPendingEmail(newEmail);
    setPendingField(field);

    return new Promise<void>((resolve, reject) => {
      setModalResolver({ resolve, reject });
      setShowVerifyModal(true);
    });
  }, []);

  const handleVerificationSuccess = useCallback(async () => {
    const { user: currentUser, setUser } = useFuse.getState();
    if (currentUser && pendingEmail && pendingField) {
      // 🛡️ SID-5.3: Convex mutations require callerUserId (from FUSE store's convexId)
      const callerUserId = currentUser.convexId as Id<'admin_users'>;

      if (pendingField === 'secondaryEmail') {
        setUser({ ...currentUser, secondaryEmail: pendingEmail });
        try {
          await updateUserSettings({ callerUserId, secondaryEmail: pendingEmail });
        } catch (err) {
          console.error('Failed to update secondary email in Convex:', err);
        }
      } else {
        setUser({ ...currentUser, email: pendingEmail });
        try {
          await updateUserSettings({ callerUserId, email: pendingEmail });
        } catch (err) {
          console.error('Failed to update email in Convex:', err);
        }
      }

      try {
        await refreshSessionAfterUpload();
      } catch (err) {
        console.error('Failed to refresh session cookie:', err);
      }
    }

    modalResolver?.resolve();
    setShowVerifyModal(false);
    setPendingEmail(null);
    setPendingField(null);
    setModalResolver(null);
  }, [modalResolver, pendingEmail, pendingField, updateUserSettings]);

  const handleVerificationClose = useCallback(() => {
    modalResolver?.reject(new Error('Verification cancelled'));
    setShowVerifyModal(false);
    setPendingEmail(null);
    setPendingField(null);
    setModalResolver(null);
  }, [modalResolver]);

  // ─────────────────────────────────────────────────────────────────────
  // Make Primary Handler
  // ─────────────────────────────────────────────────────────────────────

  const handleSwapClick = useCallback(async () => {
    if (swapState === 'executing' || removeState !== 'idle') return;

    if (swapState === 'idle') {
      setSwapState('confirming');
      return;
    }

    setSwapState('executing');
    try {
      const result = await swapEmailsToPrimary(secondaryEmail);
      if (result.error) {
        console.error('Swap error:', result.error);
        return;
      }

      const { user: currentUser, setUser } = useFuse.getState();
      if (currentUser) {
        const oldPrimary = currentUser.email;
        setUser({
          ...currentUser,
          email: secondaryEmail,
          secondaryEmail: oldPrimary,
        });

        // 🛡️ SID-5.3: Convex mutations require callerUserId (from FUSE store's convexId)
        const callerUserId = currentUser.convexId as Id<'admin_users'>;
        await updateUserSettings({
          callerUserId,
          email: secondaryEmail || undefined,
          secondaryEmail: primaryEmail || undefined,
        });
      }

      await refreshSessionAfterUpload();
    } catch (err) {
      console.error('Failed to swap emails:', err);
    } finally {
      setSwapState('idle');
    }
  }, [primaryEmail, removeState, secondaryEmail, swapState, updateUserSettings]);

  const handleSwapBlur = useCallback(() => {
    if (swapState === 'confirming') {
      setTimeout(() => setSwapState('idle'), 150);
    }
  }, [swapState]);

  // ─────────────────────────────────────────────────────────────────────
  // Remove Handler
  // ─────────────────────────────────────────────────────────────────────

  const handleRemoveClick = useCallback(async () => {
    if (removeState === 'executing' || swapState !== 'idle') return;

    if (removeState === 'idle') {
      setRemoveState('confirming');
      return;
    }

    setRemoveState('executing');
    try {
      const result = await deleteSecondaryEmail(secondaryEmail);
      if (result.error) {
        console.error('Remove error:', result.error);
        return;
      }

      const { user: currentUser, setUser } = useFuse.getState();
      if (currentUser) {
        setUser({
          ...currentUser,
          secondaryEmail: undefined,
        });

        // 🛡️ SID-5.3: Convex mutations require callerUserId (from FUSE store's convexId)
        const callerUserId = currentUser.convexId as Id<'admin_users'>;
        await updateUserSettings({
          callerUserId,
          secondaryEmail: undefined,
        });
      }

      await refreshSessionAfterUpload();
    } catch (err) {
      console.error('Failed to remove email:', err);
    } finally {
      setRemoveState('idle');
    }
  }, [removeState, secondaryEmail, swapState, updateUserSettings]);

  const handleRemoveBlur = useCallback(() => {
    if (removeState === 'confirming') {
      setTimeout(() => setRemoveState('idle'), 150);
    }
  }, [removeState]);

  // ─────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────

  const currentEmailForModal = pendingField === 'email' ? primaryEmail : secondaryEmail;

  const swapClasses = [
    'ft-emailtab-action-pill',
    swapState === 'executing' && 'ft-emailtab-action-pill--active',
    swapState === 'confirming' && 'ft-emailtab-action-pill--confirm',
  ].filter(Boolean).join(' ');

  const removeClasses = [
    'ft-emailtab-action-pill',
    removeState === 'executing' && 'ft-emailtab-action-pill--active',
    removeState === 'confirming' && 'ft-emailtab-action-pill--confirm',
  ].filter(Boolean).join(' ');

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <>
      <Card.standard
        title="Email Settings"
        subtitle="Manage your email addresses and preferences"
      >
        <div className="vr-field-spacing">
          <div className="vr-field-row">
            {/* Primary Email */}
            <Field.verify
              label="Primary Email"
              value={primaryEmail}
              onCommit={(v) => handleEmailCommit('email', v)}
              type="email"
              helper="* Changing your email will require verification"
            />

            {/* Secondary Email + Actions */}
            <div className="ft-emailtab-field-with-action">
              <Field.verify
                label="Secondary Email (Optional)"
                value={secondaryEmail}
                onCommit={(v) => handleEmailCommit('secondaryEmail', v)}
                type="email"
                placeholder="Not set"
              />

              {/* Actions - only show when secondary email exists */}
              {secondaryEmail && (
                <div className="ft-emailtab-action-pills">
                  <button
                    type="button"
                    onClick={handleSwapClick}
                    onBlur={handleSwapBlur}
                    disabled={swapState === 'executing' || removeState !== 'idle'}
                    className={swapClasses}
                  >
                    <T.caption size="xs" weight="medium">
                      {swapState === 'executing' ? (
                        <span className="ft-emailtab-action-pill__typing">Swapping...</span>
                      ) : swapState === 'confirming' ? 'Confirm →' : 'Make Primary'}
                    </T.caption>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveClick}
                    onBlur={handleRemoveBlur}
                    disabled={removeState === 'executing' || swapState !== 'idle'}
                    className={removeClasses}
                  >
                    <T.caption size="xs" weight="medium">
                      {removeState === 'executing' ? (
                        <span className="ft-emailtab-action-pill__typing">Removing...</span>
                      ) : removeState === 'confirming' ? 'Confirm →' : 'Remove'}
                    </T.caption>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card.standard>

      {/* Verification Modal - VerifyEmail for primary, VerifySecondary for secondary */}
      {pendingField === 'email' ? (
        <VerifyEmail
          isOpen={showVerifyModal}
          email={pendingEmail ?? ''}
          currentEmail={currentEmailForModal || undefined}
          onSuccess={handleVerificationSuccess}
          onClose={handleVerificationClose}
        />
      ) : (
        <VerifySecondary
          isOpen={showVerifyModal}
          email={pendingEmail ?? ''}
          currentEmail={currentEmailForModal || undefined}
          onSuccess={handleVerificationSuccess}
          onClose={handleVerificationClose}
        />
      )}
    </>
  );
}
