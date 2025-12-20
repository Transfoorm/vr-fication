/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Green Button                                      │
│  /src/prebuilts/button/Green.tsx                                      │
│                                                                        │
│  Classic website green for success/confirm actions.                    │
│                                                                        │
│  Usage:                                                                │
│  import { Button } from '@/prebuilts/button';                          │
│  <Button.green onClick={handleConfirm}>Confirm</Button.green>          │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface GreenButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * GreenButton - Classic website green for success/confirm actions
 *
 * Features:
 * - Classic green background
 * - Hover lift effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Success actions
 * - Confirm buttons
 * - Save/Submit
 * - Positive outcomes
 */
export default function GreenButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: GreenButtonProps) {
  return (
    <button
      className={`vr-button vr-button-green ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="vr-button-spinner">•••</span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="vr-button-icon">{icon}</span>}
          <span className="vr-button-text">{children}</span>
          {icon && iconPosition === 'right' && <span className="vr-button-icon">{icon}</span>}
        </>
      )}
    </button>
  );
}
