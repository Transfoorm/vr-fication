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

import '../account-page.css';
import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import { Field, Card, T, Stack } from '@/vr';
import { VerifyEmail } from '@/app/(clerk)/features/VerifyEmail';
import { VerifySecondary } from '@/app/(clerk)/features/VerifySecondary';
import { swapEmailsToPrimary, deleteSecondaryEmail } from '@/app/(clerk)/actions/email';
import type { EmailAccount } from '@/features/productivity/email-console/types';
import { refreshSessionAfterUpload } from '@/app/actions/user-mutations';
import { useProductivityData } from '@/hooks/useProductivityData';

type ActionState = 'idle' | 'confirming' | 'executing';
type DisconnectState = Record<string, ActionState>;

export function EmailFields() {
  // ─────────────────────────────────────────────────────────────────────
  // FUSE State (source of truth)
  // ─────────────────────────────────────────────────────────────────────
  const user = useFuse((s) => s.user);
  const setShadowKingActive = useFuse((s) => s.setShadowKingActive);
  const primaryEmail = user?.email ?? '';
  const secondaryEmail = user?.secondaryEmail ?? '';
  const emailVerified = user?.emailVerified ?? false;
  const setupPending = user?.setupStatus === 'pending';

  // Productivity data (email accounts)
  const { data: { email } } = useProductivityData();
  const connectedAccounts = email?.accounts ?? [];

  // ─────────────────────────────────────────────────────────────────────
  // Convex Mutations
  // ─────────────────────────────────────────────────────────────────────
  const updateUserSettings = useMutation(api.domains.settings.mutations.updateUserSettings);
  const disconnectOutlook = useMutation(api.productivity.email.outlook.disconnectOutlookAccount);

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
  // Disconnect State (per account, keyed by accountId)
  // ─────────────────────────────────────────────────────────────────────
  const [disconnectStates, setDisconnectStates] = useState<DisconnectState>({});

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
      const callerUserId = currentUser.convexId as Id<'admin_users'>;

      try {
        // Step 1: Update Convex FIRST (before FUSE)
        if (pendingField === 'secondaryEmail') {
          await updateUserSettings({ callerUserId, secondaryEmail: pendingEmail });
          // Step 2: Only update FUSE after Convex succeeds
          setUser({ ...currentUser, secondaryEmail: pendingEmail });
        } else {
          await updateUserSettings({ callerUserId, email: pendingEmail });
          setUser({ ...currentUser, email: pendingEmail });
        }

        await refreshSessionAfterUpload();
      } catch (err) {
        console.error('Failed to update email in Convex:', err);
        // Clerk already verified, but Convex failed - modal will close but data won't sync
        // TODO: Show user error and potentially retry
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
      // Step 1: Swap in Clerk (source of auth truth)
      const result = await swapEmailsToPrimary(secondaryEmail);
      if (result.error) {
        console.error('Swap error:', result.error);
        return;
      }

      const { user: currentUser, setUser } = useFuse.getState();
      if (!currentUser) return;

      const oldPrimary = currentUser.email;
      const callerUserId = currentUser.convexId as Id<'admin_users'>;

      // Step 2: Update Convex FIRST (before FUSE) - ensures DB matches Clerk
      await updateUserSettings({
        callerUserId,
        email: secondaryEmail || undefined,
        secondaryEmail: oldPrimary || undefined,
      });

      // Step 3: Only update FUSE after Convex succeeds
      setUser({
        ...currentUser,
        email: secondaryEmail,
        secondaryEmail: oldPrimary,
      });

      await refreshSessionAfterUpload();
    } catch (err) {
      console.error('Failed to swap emails:', err);
      // TODO: Consider rolling back Clerk if Convex fails, or show user error
    } finally {
      setSwapState('idle');
    }
  }, [removeState, secondaryEmail, swapState, updateUserSettings]);

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
      // Step 1: Remove from Clerk (source of auth truth)
      const result = await deleteSecondaryEmail(secondaryEmail);
      if (result.error) {
        console.error('Remove error:', result.error);
        return;
      }

      const { user: currentUser, setUser } = useFuse.getState();
      if (!currentUser) return;

      const callerUserId = currentUser.convexId as Id<'admin_users'>;

      // Step 2: Update Convex FIRST (before FUSE) - pass null to CLEAR
      await updateUserSettings({
        callerUserId,
        secondaryEmail: null,
      });

      // Step 3: Only update FUSE after Convex succeeds
      setUser({
        ...currentUser,
        secondaryEmail: undefined,
      });

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
  // Disconnect Outlook Handler
  // ─────────────────────────────────────────────────────────────────────

  const getDisconnectState = useCallback((accountId: string): ActionState => {
    return disconnectStates[accountId] ?? 'idle';
  }, [disconnectStates]);

  const setDisconnectState = useCallback((accountId: string, state: ActionState) => {
    setDisconnectStates((prev) => ({ ...prev, [accountId]: state }));
  }, []);

  const handleDisconnectClick = useCallback(async (account: EmailAccount) => {
    const accountId = account._id;
    const currentState = getDisconnectState(accountId);

    if (currentState === 'executing') return;

    if (currentState === 'idle') {
      setDisconnectState(accountId, 'confirming');
      return;
    }

    // State is 'confirming' - execute disconnect
    setDisconnectState(accountId, 'executing');
    try {
      const userId = user?.convexId as Id<'admin_users'>;
      if (!userId) throw new Error('No user ID');

      // Cascade delete: messages, folders, cache, webhooks, account record
      await disconnectOutlook({
        userId,
        accountId: account._id as Id<'productivity_email_Accounts'>,
      });

      // Account is gone - state will update via useProductivityData reactivity
    } catch (err) {
      console.error('Failed to disconnect Outlook:', err);
      setDisconnectState(accountId, 'idle');
    }
  }, [user?.convexId, disconnectOutlook, getDisconnectState, setDisconnectState]);

  const handleDisconnectBlur = useCallback((accountId: string) => {
    const currentState = getDisconnectState(accountId);
    if (currentState === 'confirming') {
      setTimeout(() => setDisconnectState(accountId, 'idle'), 150);
    }
  }, [getDisconnectState, setDisconnectState]);

  // ─────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────

  const currentEmailForModal = pendingField === 'email' ? primaryEmail : secondaryEmail;

  // ─────────────────────────────────────────────────────────────────────
  // Shadow King Guard (blocks email editing until setup complete)
  // ─────────────────────────────────────────────────────────────────────
  const handleSetupGuard = useCallback((e: React.MouseEvent) => {
    if (setupPending) {
      e.preventDefault();
      e.stopPropagation();
      setShadowKingActive(true);
    }
  }, [setupPending, setShadowKingActive]);

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
      <Stack.lg>
        <Card.standard
          title="Email Settings"
          subtitle="Manage your email addresses and preferences"
          className="ft-emailtab-settings-card"
        >
          <Stack.lg>
            <Stack.row.equal>
              {/* Primary Email - guarded by Shadow King when setup pending */}
              <div onClickCapture={handleSetupGuard}>
                <Field.verify
                  label="Primary Email"
                  value={primaryEmail}
                  onCommit={(v) => handleEmailCommit('email', v)}
                  type="email"
                  helper={setupPending
                    ? '* Complete setup to modify email'
                    : '* Changing your email will require verification'}
                  isVerified={emailVerified}
                />
              </div>

              {/* Secondary Email + Actions - guarded by Shadow King when setup pending */}
              <div className="ft-emailtab-field-with-action" onClickCapture={handleSetupGuard}>
                <Field.verify
                  label="Secondary Email (Optional)"
                  value={secondaryEmail}
                  onCommit={(v) => handleEmailCommit('secondaryEmail', v)}
                  type="email"
                  placeholder={setupPending ? 'Complete setup first' : 'Not set'}
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
            </Stack.row.equal>
          </Stack.lg>
        </Card.standard>

        {/* Connected Email Accounts */}
        <Card.standard
          title="Connected Accounts"
          subtitle="Manage your connected email providers for unified inbox"
        >
          {connectedAccounts.length === 0 ? (
            <div className="ft-emailtab-empty-accounts">
              <T.body size="sm" color="secondary">
                No email accounts connected yet.
              </T.body>
              <div className="ft-emailtab-connect-button-container">
                <a
                  href="/api/auth/outlook/authorize"
                  className="ft-emailtab-connect-button"
                >
                  <T.body size="sm" weight="medium">
                    Connect Outlook
                  </T.body>
                </a>
              </div>
            </div>
          ) : (
            <div className="ft-emailtab-connected-accounts">
              {connectedAccounts.map((account: EmailAccount) => {
                const disconnectState = getDisconnectState(account._id);
                const disconnectClasses = [
                  'ft-emailtab-disconnect-pill',
                  disconnectState === 'executing' && 'ft-emailtab-disconnect-pill--active',
                  disconnectState === 'confirming' && 'ft-emailtab-disconnect-pill--confirm',
                ].filter(Boolean).join(' ');

                return (
                  <div key={account._id} className="ft-emailtab-account-row">
                    <div className="ft-emailtab-account-info">
                      <T.body size="md" weight="medium">
                        {account.label}
                      </T.body>
                      <T.caption size="sm" color="secondary">
                        {account.emailAddress}
                      </T.caption>
                      {account.status === 'active' && disconnectState === 'idle' && (
                        <T.caption size="xs" color="primary">
                          ✓ Connected
                        </T.caption>
                      )}
                      {account.status === 'error' && account.lastSyncError && (
                        <T.caption size="xs" color="muted">
                          ⚠ {account.lastSyncError}
                        </T.caption>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDisconnectClick(account)}
                      onBlur={() => handleDisconnectBlur(account._id)}
                      disabled={disconnectState === 'executing'}
                      className={disconnectClasses}
                    >
                      <T.caption size="xs" weight="medium">
                        {disconnectState === 'executing' ? (
                          <span className="ft-emailtab-action-pill__typing">Disconnecting...</span>
                        ) : disconnectState === 'confirming' ? 'Confirm →' : 'Disconnect'}
                      </T.caption>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card.standard>
      </Stack.lg>

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
