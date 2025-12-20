/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Confirmation Modal                                 │
│  /src/vr/modal/Confirmation.tsx                      │
│                                                                        │
│  Brand-matched confirmation modal for important decisions.             │
│                                                                        │
│  CONFIRMATION Modal = Decision Required                                │
│    - Purpose: Ask the user to make a choice                            │
│    - Interaction: Two buttons - "Confirm/Yes" and "Cancel/No"          │
│    - Examples:                                                         │
│      - ✅ "Delete Account? This cannot be undone"                      │
│      - ✅ "Discard changes?"                                           │
│      - ✅ "Permanently delete 5 users?"                                │
│    - User action: Choose to proceed or cancel                          │
│    - Analogy: JavaScript confirm() - asks for decision                 │
│                                                                        │
│  Usage:                                                                │
│    import { Modal } from '@/vr';                                │
│    <Modal.confirmation                                                 │
│      title="Delete Account"                                            │
│      message="This action cannot be undone. Are you sure?"             │
│      isOpen={isOpen}                                                   │
│      onConfirm={() => handleDelete()}                                  │
│      onCancel={() => setIsOpen(false)}                                 │
│      variant="danger"                                                  │
│    />                                                                  │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/vr/button';
import { T } from '@/vr';

export interface ConfirmationModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'danger';
  confirmLabel?: string;
  cancelLabel?: string;
  className?: string;
}

/**
 * ConfirmationModal - Branded decision dialog
 *
 * Features:
 * - Warm gradient background (brand colors)
 * - Warning icon for danger variant
 * - Clear confirm/cancel actions
 * - Danger button for destructive, Fire for important
 * - Fade-in + scale animation
 * - Dramatic shadows
 * - Escape key cancels
 * - Click outside cancels
 *
 * Perfect for:
 * - Delete confirmations
 * - Irreversible actions
 * - Important decisions
 * - Data loss warnings
 */
export default function ConfirmationModal({
  title,
  message,
  isOpen,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  className = ''
}: ConfirmationModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Portal target (only available client-side)
  if (typeof document === 'undefined') return null;

  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close after confirm
  };

  // Icon for danger variant - styled via CSS
  const warningIcon = (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const modalContent = (
    <div
      className="vr-modal-backdrop"
      onClick={onCancel}
    >
      <div
        className={`vr-modal vr-modal-confirmation vr-modal-confirmation-${variant} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="vr-modal-confirmation-title"
      >
        {/* Warning Icon (only for danger variant) */}
        {variant === 'danger' && (
          <div className="vr-modal-confirmation-icon vr-modal-confirmation-icon-danger">
            {warningIcon}
          </div>
        )}

        {/* Header */}
        <div className="vr-modal-confirmation-header" id="vr-modal-confirmation-title">
          <T.title size="xl" weight="bold" className="vr-modal-confirmation-title">
            {title}
          </T.title>
        </div>

        {/* Message */}
        <T.body size="md" className="vr-modal-confirmation-message">
          {message}
        </T.body>

        {/* Actions */}
        <div className="vr-modal-confirmation-actions">
          <Button.ghost onClick={onCancel}>
            {cancelLabel}
          </Button.ghost>
          {variant === 'danger' ? (
            <Button.danger onClick={handleConfirm}>
              {confirmLabel}
            </Button.danger>
          ) : (
            <Button.fire onClick={handleConfirm}>
              {confirmLabel}
            </Button.fire>
          )}
        </div>

        {/* Optional close link */}
        <Button.link
          onClick={onCancel}
          className="vr-modal-confirmation-close-link"
        >
          Nevermind
        </Button.link>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
