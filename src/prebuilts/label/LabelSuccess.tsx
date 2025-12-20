/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Label Success                                      │
│  /src/prebuilts/label/Success.tsx                                      │
│                                                                        │
│  Success message display for form fields with positive feedback.      │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useEffect } from 'react';
import { Icon, T } from '@/prebuilts';

export interface LabelSuccessProps {
  /** Success message to display */
  message: string;
  /** Show success icon */
  showIcon?: boolean;
  /** Animation type */
  animation?: 'none' | 'slide' | 'fade' | 'bounce';
  /** Auto-hide after duration (ms) */
  autoHide?: number;
  /** Additional className */
  className?: string;
}

/**
 * LabelSuccess - Success message display
 * TTT Gap Model compliant - no external margins
 */
export default function LabelSuccess({
  message,
  showIcon = true,
  animation = 'slide',
  autoHide,
  className = ''
}: LabelSuccessProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoHide && autoHide > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, autoHide);
      return () => clearTimeout(timer);
    }
  }, [autoHide]);

  if (!isVisible) return null;

  const classes = [
    'vr-label-success',
    animation !== 'none' && `vr-label-success--${animation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status">
      {showIcon && (
        <Icon variant="check-circle" size="sm" className="vr-label-success-icon" />
      )}
      <T.body size="sm" className="vr-label-success-message">
        {message}
      </T.body>
    </div>
  );
}
