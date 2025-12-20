/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Danger Button                                      │
│  /src/components/prebuilts/button/danger/index.tsx                     │
│                                                                        │
│  Red button for destructive actions.                                   │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.danger onClick={handleDelete}>Delete</ButtonVC.danger>    │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes} from 'react';

export interface DangerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * DangerButton - Red for destructive actions
 *
 * Features:
 * - Red background for danger
 * - Hover lift effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Delete actions
 * - Destructive operations
 * - Critical warnings
 * - Account deletion
 */
export default function DangerButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: DangerButtonProps) {
  return (
    <button
      className={`vr-button vr-button-danger ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
