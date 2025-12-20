/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Outline Button                                     │
│  /src/components/prebuilts/button/outline/index.tsx                    │
│                                                                        │
│  Border-only button for secondary actions (Phoenix Flow compatible).  │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.outline onClick={handleClick}>Skip</ButtonVC.outline>     │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface OutlineButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * OutlineButton - Border-only for secondary actions
 *
 * Features:
 * - Transparent background with border
 * - Subtle hover effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Secondary actions (Cancel, Skip)
 * - Alternative options
 * - Dismissal actions
 * - Phoenix Flow skip buttons
 */
export default function OutlineButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: OutlineButtonProps) {
  return (
    <button
      className={`vr-button vr-button-outline ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
