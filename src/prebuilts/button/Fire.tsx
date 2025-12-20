/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Fire Button                                        │
│  /src/components/prebuilts/button/fire/index.tsx                       │
│                                                                        │
│  Fire gradient button for high-impact CTAs (Phoenix Flow compatible). │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.fire onClick={handleClick}>Complete Setup</ButtonVC.fire> │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface FireButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * FireButton - Dramatic gradient for high-impact CTAs
 *
 * Features:
 * - Fire-orange gradient background
 * - Dramatic shadow effect
 * - Text shadow for depth
 * - Hover opacity transition
 * - Icon support (left or right)
 * - Loading state
 * - Full width option
 *
 * Perfect for:
 * - Setup completion flows (Phoenix Flow)
 * - High-impact primary actions
 * - Conversion-focused CTAs
 * - Onboarding completions
 */
export default function FireButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: FireButtonProps) {
  return (
    <button
      className={`vr-button vr-button-fire ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="vr-button-icon">{icon}</span>
      )}
      <span className="vr-button-text">{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="vr-button-icon">{icon}</span>
      )}
    </button>
  );
}
