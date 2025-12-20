/**──────────────────────────────────────────────────────────────────────┐
│  ☢️ VANISH QUARANTINE - The Contaminated Zone                        │
│  /src/components/vanish/Quarantine.tsx                                │
│                                                                        │
│  ⚠️ CLERK SDK INTEGRATION - QUARANTINED CODE                          │
│  This component imports Clerk SDK and must remain isolated.           │
│  Dynamically imported by Drawer.tsx to prevent contaminating FUSE.    │
│                                                                        │
│  Contains:                                                             │
│  - Deletion form UI                                                    │
│  - Clerk API calls                                                     │
│  - Batch deletion logic                                                │
│  - Audit trail notices                                                 │
│                                                                        │
│  See /docs/CLERK-EXCEPTIONS.md for architectural justification.       │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Icon, Badge, T } from '@/prebuilts';
import { useVanish } from '@/features/vanish/VanishContext';
import { useFuse } from '@/store/fuse';

// Type for deletion target
// 🛡️ S.I.D. Phase 15: VANISH now uses sovereign _id for target identification
type DeletionTarget = {
  _id: string;  // Convex sovereign ID
  name: string;
  email: string;
  rank: 'admiral' | 'commodore' | 'captain' | 'crew';
  setupStatus: 'complete' | 'pending' | 'invited' | 'abandon' | 'revoked' | null | undefined | string;
};

/**
 * VANISH Quarantine Component
 *
 * ☢️ CONTAMINATED: Contains Clerk SDK integration
 * This component is dynamically imported to maintain quarantine.
 * Manages its own animation state to prevent flicker on mount.
 */
export function VanishQuarantine() {
  const { config, closeDrawer, triggerComplete } = useVanish();
  const [isVisible, setIsVisible] = useState(false);
  const hydrateAdmin = useFuse((state) => state.hydrateAdmin);

  // 🛡️ S.I.D. Phase 15: Query now uses callerUserId (sovereign)
  const fuseUser = useFuse((state) => state.user);
  const allUsers = useQuery(
    api.domains.admin.users.api.getAllUsers,
    fuseUser?.id ? { callerUserId: fuseUser.id as Id<"admin_users"> } : "skip"
  );

  /**
   * Force refresh FUSE admin data via WARP after deletion
   * This ensures the UI updates immediately without waiting for Convex push
   */
  const refreshAdminData = useCallback(async () => {
    try {
      const response = await fetch('/api/warp/admin');
      if (response.ok) {
        const data = await response.json();
        hydrateAdmin(data, 'WARP');
        console.log('🔥 VANISH: Admin data refreshed via WARP after deletion');
      }
    } catch (error) {
      console.error('🔥 VANISH: Failed to refresh admin data:', error);
    }
  }, [hydrateAdmin]);

  /**
   * ⚠️ CLERK API INTEGRATION POINT
   * 🛡️ S.I.D. Phase 15: Now accepts sovereign userId, internally looks up clerkId
   *
   * This action calls Clerk's API to delete user authentication records.
   * This is the ONLY place in VANISH that directly touches Clerk.
   */
  const deleteUser = useAction(api.vanish.deleteAnyUserAction.deleteAnyUserWithClerkV2);

  // Deletion state
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Build target array from config (supports both Convex IDs and Clerk IDs)
  const targetIds: string[] = [];
  if (config?.target) {
    targetIds.push(config.target);
  }
  if (config?.targets) {
    targetIds.push(...config.targets);
  }

  // 🛡️ S.I.D. Phase 15: Resolve user data for targets using sovereign _id only
  const targets: DeletionTarget[] = allUsers
    ? allUsers
        .filter((u) => targetIds.includes(u._id))
        .map((u) => ({
          _id: u._id,
          name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown',
          email: u.email,
          rank: (u.rank || 'crew') as 'admiral' | 'commodore' | 'captain' | 'crew',
          setupStatus: (u.setupStatus || 'unknown') as string
        }))
    : [];

  const isBatch = targets.length > 1;
  const hasTargets = targets.length > 0;

  // Trigger entrance animation with requestAnimationFrame
  // Only triggers when we actually have targets to display
  useEffect(() => {
    if (!hasTargets) return;

    // Double rAF ensures browser paint happens before animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });
  }, [hasTargets]);

  // Reset form state when drawer closes
  useEffect(() => {
    if (!isVisible) {
      setDeleteReason('');
      setConfirmText('');
      setIsDeleting(false);
    }
  }, [isVisible]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Wait for exit animation before calling closeDrawer (300ms)
    setTimeout(() => {
      closeDrawer();
    }, 300);
  }, [closeDrawer]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && !isDeleting) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isDeleting, handleClose]);

  const handleDeleteConfirm = async () => {
    if (confirmText !== 'DELETE') {
      alert('You must type DELETE to confirm');
      return;
    }
    if (!deleteReason.trim()) {
      alert('Deletion reason is required');
      return;
    }

    if (!targets || targets.length === 0) {
      alert('No targets specified');
      return;
    }

    setIsDeleting(true);

    if (isBatch) {
      // Batch deletion
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const target of targets) {
        try {
          // 🛡️ S.I.D. Phase 15: Pass sovereign _id, action looks up clerkId internally
          const result = await deleteUser({
            targetUserId: target._id as Id<"admin_users">,
            reason: deleteReason
          });

          if (result.success) {
            successCount++;
          } else {
            failCount++;
            errors.push(`${target.name}: ${result.message}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${target.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setIsDeleting(false);

      // Trigger completion callback (show success modal immediately)
      triggerComplete({
        success: failCount === 0,
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined,
        deletedUsers: targets.map((t: DeletionTarget) => ({ name: t.name, email: t.email }))
      });

      handleClose();

      // Refresh FUSE in background (WARP-style, don't block UI)
      if (successCount > 0) {
        refreshAdminData();
      }
    } else {
      // Single deletion
      try {
        // 🛡️ S.I.D. Phase 15: Pass sovereign _id, action looks up clerkId internally
        const result = await deleteUser({
          targetUserId: targets[0]._id as Id<"admin_users">,
          reason: deleteReason
        });

        if (result.success) {
          const deletedUser = targets[0];

          // Trigger completion callback (show success modal immediately)
          triggerComplete({
            success: true,
            successCount: 1,
            deletedUsers: [{ name: deletedUser.name, email: deletedUser.email }]
          });

          handleClose();

          // Refresh FUSE in background (WARP-style, don't block UI)
          refreshAdminData();
        } else {
          // Trigger failure callback
          triggerComplete({
            success: false,
            successCount: 0,
            failCount: 1,
            errors: [result.message]
          });
        }
      } catch (error) {
        // Trigger error callback
        triggerComplete({
          success: false,
          successCount: 0,
          failCount: 1,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
        setIsDeleting(false);
      }
    }
  };

  // Don't render until we have targets resolved
  if (!hasTargets) {
    return null;
  }

  // Get portal target element
  const portalTarget = document.getElementById('vanish-drawer-portal');
  if (!portalTarget) {
    console.error('[VanishQuarantine] Portal target #vanish-drawer-portal not found');
    return null;
  }

  // Render drawer via React Portal
  return createPortal(
    <>
      {/* Backdrop - Dims FUSE organism (visible threshold) */}
      <div
        onClick={!isDeleting ? handleClose : undefined}
        className={`ft-vanish-backdrop ${isVisible ? 'ft-vanish-backdrop--visible' : 'ft-vanish-backdrop--hidden'} ${isDeleting ? 'ft-vanish-backdrop--deleting' : 'ft-vanish-backdrop--interactive'}`}
      />

      {/* The Drawer Portal - VANISH Realm */}
      <div
        className={`ft-vanish-drawer ${isVisible ? 'ft-vanish-drawer--visible' : 'ft-vanish-drawer--hidden'}`}
      >
        {/* VANISH Protocol Header - The Threshold Marker */}
        <div className="ft-vanish-header">
          <div className="ft-vanish-header-content">
            <span className="ft-vanish-header-icon">🔥</span>
            <div>
              <T.h3 weight="bold" className="ft-vanish-header-title">
                Vanish Protocol
              </T.h3>
              <T.body size="sm" className="ft-vanish-header-subtitle">
                You are in quarantine • Deleted records are irreversible • Records are listed in <em><b>Deleted Users</b></em>
              </T.body>
            </div>
          </div>

          {/* Close Portal Button */}
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="ft-vanish-header-close"
          >
            🔥 Exit Vanish Portal
          </button>
        </div>

        {/* Deletion Form - The Ritual */}
        <div className="ft-vanish-form">
          <T.h2 weight="bold" className="ft-vanish-form-title">
            <Icon variant="trash" size="md" />
            Delete User Account{isBatch ? 's' : ''}
          </T.h2>

          <div className="ft-vanish-target-card">
            <T.body size="sm" className="ft-vanish-target-label">
              You are about to permanently delete {isBatch ? `${targets.length} users` : ''}:
            </T.body>

            {isBatch ? (
              // Batch: Show scrollable list
              <div className="ft-vanish-target-list">
                {targets.map((target: DeletionTarget) => (
                  <div
                    key={target._id}
                    className="ft-vanish-target-item"
                  >
                    <T.body size="sm" weight="semibold" className="ft-vanish-target-name">
                      {target.name}
                    </T.body>
                    <T.caption size="xs" className="ft-vanish-target-details">
                      <span>{target.email}</span>
                      <span>•</span>
                      <Badge.rank rank={target.rank} />
                      <span>•</span>
                      <Badge.setup status={target.setupStatus as 'complete' | 'pending' | 'invited' | 'abandon' | 'revoked' | null | undefined} />
                    </T.caption>
                  </div>
                ))}
              </div>
            ) : (
              // Single: Show detailed card
              <>
                <T.body size="lg" weight="semibold" className="ft-vanish-target-single-name">
                  {targets[0].name}
                </T.body>
                <T.body size="sm" className="ft-vanish-target-single-email">
                  {targets[0].email}
                </T.body>
                <T.caption size="sm" className="ft-vanish-target-single-badges">
                  <Badge.rank rank={targets[0].rank} />
                  <Badge.setup status={targets[0].setupStatus as 'complete' | 'pending' | 'invited' | 'abandon' | 'revoked' | null | undefined} />
                </T.caption>
              </>
            )}
          </div>

          {/* Deletion Reason */}
          <div className="ft-vanish-field">
            <label className="ft-vanish-label">
              <T.body size="sm" weight="semibold">
                Reason for deletion <span className="ft-vanish-label-required">*</span>
              </T.body>
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="e.g., Account violation, User request, Data cleanup, etc."
              className="ft-vanish-textarea"
            />
          </div>

          {/* Confirmation Field */}
          <div className="ft-vanish-field">
            <label className="ft-vanish-label">
              <T.body size="sm" weight="semibold">
                Type <span className="ft-vanish-confirmation-code">DELETE</span> to confirm:
              </T.body>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="ft-vanish-input"
            />
          </div>

          {/* Action Buttons */}
          <div className="ft-vanish-actions">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="ft-vanish-button-cancel"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={isDeleting || confirmText !== 'DELETE' || !deleteReason.trim()}
              className="ft-vanish-button-delete"
            >
              {isDeleting
                ? (isBatch ? `Deleting ${targets.length} Users...` : 'Deleting...')
                : (isBatch ? `Delete ${targets.length} Users Permanently` : 'Delete User Permanently')
              }
            </button>
          </div>

          {/* Audit Trail Notice */}
          <div className="ft-vanish-audit-notice">
            <T.h4 weight="semibold" className="ft-vanish-audit-title">
              🔎 Audit Trail Notice
            </T.h4>
            <T.caption size="xs">This deletion will create an audit log entry:</T.caption>
            <ul className="ft-vanish-audit-list">
              <li><T.caption size="xs">Who deleted who (an Admiral account)</T.caption></li>
              <li><T.caption size="xs">When the deletion occurred (UTC timestamp)</T.caption></li>
              <li><T.caption size="xs">Why it happened (your stated reason)</T.caption></li>
              <li><T.caption size="xs">Cascade scope (all affected tables and records)</T.caption></li>
            </ul>
            <T.caption size="xs">This action cannot be undone. The audit trail is permanent.</T.caption>
          </div>
        </div>
      </div>
    </>,
    portalTarget
  );
}
