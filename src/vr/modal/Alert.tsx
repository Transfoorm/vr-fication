/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Alert Modal                                        │
│  /src/vr/modal/Alert.tsx                             │
│                                                                        │
│  Brand-matched alert modal for notifications and results.              │
│                                                                        │
│  ALERT Modal = Information Display                                     │
│    - Purpose: Tell the user something happened                         │
│    - Interaction: Single button (dismiss only)                         │
│    - Examples:                                                         │
│      - ✅ "Success! 2 users deleted"                                   │
│      - ✅ "Error: Failed to upload"                                    │
│      - ✅ "Warning: Low disk space"                                    │
│      - ✅ "Info: New version available"                                │
│    - User action: Acknowledge and dismiss                              │
│    - Analogy: JavaScript alert() - just shows info                     │
│                                                                        │
│  Usage:                                                                │
│    import { Modal } from '@/vr';                                │
│                                                                        │
│    // Basic usage                                                      │
│    <Modal.alert                                                        │
│      title="Success"                                                   │
│      message="User deleted successfully"                               │
│      isOpen={isOpen}                                                   │
│      onClose={() => setIsOpen(false)}                                  │
│      variant="success"                                                 │
│    />                                                                  │
│                                                                        │
│    // With structured details                                          │
│    <Modal.alert                                                        │
│      title="User Deleted"                                              │
│      message="Deletion completed successfully"                         │
│      details={[                                                        │
│        "Name: John Doe",                                               │
│        "Email: john@example.com",                                      │
│        "Records affected: 47"                                          │
│      ]}                                                                │
│      isOpen={isOpen}                                                   │
│      onClose={() => setIsOpen(false)}                                  │
│      variant="success"                                                 │
│    />                                                                  │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { T } from '@/vr';

export interface AlertModalProps {
  title: string;
  message: string;
  isOpen: boolean;
  onClose: () => void;
  variant?: 'info' | 'success' | 'warning' | 'error';
  buttonLabel?: string;
  className?: string;
  details?: string[]; // Optional array of detail lines (e.g., ["User: John Doe", "Email: john@example.com", "Records: 47"])
}

/**
 * AlertModal - Professional terminal/dashboard-style notification modal
 *
 * Features:
 * - Clean white background with colored accent border
 * - Variant-aware colors (green/red/orange/blue)
 * - Compact, data-dense layout
 * - Optional structured details display
 * - Left-aligned for readability
 * - Single decisive button
 * - Terminal/dashboard aesthetic
 * - Auto-close on escape
 * - Click outside to close
 *
 * Perfect for:
 * - Deletion success/error results with details
 * - Operation confirmations with metrics
 * - Warning messages with context
 * - Info alerts with structured data
 */
export default function AlertModal({
  title,
  message,
  isOpen,
  onClose,
  variant = 'info',
  buttonLabel = 'OK',
  className = '',
  details
}: AlertModalProps) {
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

  // Portal target (only available client-side)
  if (typeof document === 'undefined') return null;

  // Compact icon SVGs (20px) - styled via CSS
  const iconSVGs = {
    info: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    ),
    warning: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    )
  };

  const modalContent = (
    <div
      className="vr-modal-backdrop"
      onClick={onClose}
    >
      <div
        className={`vr-modal vr-modal-alert vr-alert-${variant} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
      >
        {/* Header with colored background */}
        <div className="vr-modal-alert-header" id="alert-title">
          <div className="vr-modal-alert-header-content">
            {iconSVGs[variant]}
            <T.title size="sm" weight="semibold" className="vr-modal-alert-title">
              {title}
            </T.title>
          </div>
        </div>

        {/* Content */}
        <div className="vr-modal-alert-content">
          <T.body size="sm" className="vr-modal-alert-message">
            {message}
          </T.body>

          {/* Details Section (if provided) */}
          {details && details.length > 0 && (
            <div className="vr-modal-alert-details">
              <T.caption className="vr-modal-alert-details-header">
                Details
              </T.caption>
              <ul className="vr-modal-alert-details-list">
                {details.map((detail, index) => {
                  // Empty string = skip (no blank lines)
                  if (detail === '') return null;

                  // "---" = divider line
                  const isDivider = detail.trim() === '---';

                  // All-caps single word without punctuation = section header (like REASON, NOTES)
                  // This excludes multi-word text or text with colons
                  const isSectionHeader = /^[A-Z]{2,15}$/.test(detail.trim()) && !detail.includes(':');

                  if (isDivider) {
                    return <li key={index} className="vr-modal-alert-details-divider" />;
                  }

                  return (
                    <li key={index} className={isSectionHeader ? "vr-modal-alert-details-item vr-modal-alert-details-item-section-header" : "vr-modal-alert-details-item"}>
                      <span className="vr-modal-alert-details-bullet">●</span>
                      {detail}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="vr-modal-alert-button"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
