/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Dialogue Modal                                     │
│  /src/components/prebuilts/modal/Dialogue.tsx                          │
│                                                                        │
│  Standard dialogue modal with header, content, and action buttons.     │
│                                                                        │
│  Usage:                                                                │
│  import { Modal } from '@/vr/modal';                            │
│  <Modal.dialogue                                                       │
│    title="Confirm Action"                                              │
│    isOpen={isOpen}                                                     │
│    onClose={() => setIsOpen(false)}                                    │
│  >                                                                     │
│    <p>Are you sure you want to proceed?</p>                            │
│  </Modal.dialogue>                                                     │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, useEffect } from 'react';
import { T } from '@/vr';

export interface DialogueModalProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }[];
  className?: string;
}

/**
 * DialogueModal - Standard modal dialog
 *
 * Features:
 * - Backdrop with blur effect
 * - Escape key to close
 * - Click outside to close
 * - Custom action buttons
 * - Accessible with ARIA labels
 *
 * Perfect for:
 * - User confirmations
 * - Data entry forms
 * - Content preview
 * - Settings panels
 */
export default function DialogueModal({
  title,
  children,
  isOpen,
  onClose,
  actions = [],
  className = ''
}: DialogueModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="vr-modal-dialogue-backdrop"
      onClick={onClose}
    >
      <div
        className={`vr-modal vr-modal-dialogue ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vr-modal-dialogue-title"
      >
        {/* Header */}
        <div className="vr-modal-dialogue-header" id="vr-modal-dialogue-title">
          <T.title size="md" weight="semibold" className="vr-modal-dialogue-title">
            {title}
          </T.title>
          <button
            className="vr-modal-dialogue-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="vr-modal-dialogue-content">
          {children}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="vr-modal-dialogue-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                className={`vr-modal-dialogue-action-button vr-modal-dialogue-action-${action.variant || 'secondary'}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
