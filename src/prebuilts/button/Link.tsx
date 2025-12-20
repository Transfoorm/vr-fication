/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Link Button                                        │
│  /src/components/prebuilts/button/link/index.tsx                       │
│                                                                        │
│  Text-only button styled as a link.                                    │
│                                                                        │
│  Usage:                                                                │
│  import { ButtonVC } from '@/prebuilts/button';            │
│  <ButtonVC.link onClick={handleClick}>Learn More</ButtonVC.link>     │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, ButtonHTMLAttributes } from 'react';

export interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * LinkButton - Text-only styled as hyperlink
 *
 * Features:
 * - Looks like a link
 * - Underline on hover
 * - Icon support (left or right)
 * - Loading state
 * - No background or border
 *
 * Perfect for:
 * - Inline actions
 * - Navigation triggers
 * - Learn more links
 * - Modal/drawer openers
 */
export default function LinkButton({
  children,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: LinkButtonProps) {
  return (
    <button
      className={`vr-button vr-button-link ${fullWidth ? 'vr-button-full-width' : ''} ${className}`}
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
