/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Ghost Button                                       │
│  /src/components/prebuilts/button/ghost/index.tsx                      │
│                                                                        │
│  Transparent button with hover background.                             │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.ghost onClick={handleClick}>More Options</ButtonVC.ghost> │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface GhostButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * GhostButton - Transparent with subtle hover
 *
 * Features:
 * - No border or background (until hover)
 * - Minimal visual weight
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Tertiary actions
 * - Menu items
 * - Icon buttons
 * - Subtle interactions
 */
export default function GhostButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: GhostButtonProps) {
  return (
    <button
      className={`vr-button vr-button-ghost ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
