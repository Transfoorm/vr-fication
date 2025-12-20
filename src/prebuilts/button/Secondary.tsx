/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Secondary Button                                   │
│  /src/components/prebuilts/button/secondary/index.tsx                  │
│                                                                        │
│  Outlined button for secondary actions.                                │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.secondary onClick={handleClick}>Cancel</ButtonVC.secondary>│
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * SecondaryButton - Outlined button for secondary actions
 *
 * Features:
 * - Outlined style with border
 * - Subtle hover effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Cancel actions
 * - Alternative options
 * - Less important CTAs
 */
export default function SecondaryButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      className={`vr-button vr-button-secondary ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
