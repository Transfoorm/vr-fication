/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Blue Button                                       │
│  /src/prebuilts/button/Blue.tsx                                       │
│                                                                        │
│  Classic website blue for informational actions.                       │
│                                                                        │
│  Usage:                                                                │
│  import { Button } from '@/prebuilts/button';                          │
│  <Button.blue onClick={handleInfo}>Learn More</Button.blue>            │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface BlueButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * BlueButton - Classic website blue for informational actions
 *
 * Features:
 * - Classic blue background
 * - Hover lift effect
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Info actions
 * - Learn more links
 * - Help buttons
 * - Navigation
 */
export default function BlueButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: BlueButtonProps) {
  return (
    <button
      className={`vr-button vr-button-blue ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
