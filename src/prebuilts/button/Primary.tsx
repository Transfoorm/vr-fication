/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Primary Button                                     │
│  /src/components/prebuilts/button/primary/index.tsx                    │
│                                                                        │
│  Solid brand-colored button for primary actions.                       │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.primary onClick={handleClick}>Save</ButtonVC.primary>     │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * PrimaryButton - Solid brand color for primary CTAs
 *
 * Features:
 * - Prominent brand color background
 * - Hover lift effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Primary CTAs (Save, Submit, Create)
 * - Main actions
 * - Form submissions
 */
export default function PrimaryButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      className={`vr-button vr-button-primary ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
