/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Label Warning                                      │
│  /src/vr/label/Warning.tsx                                      │
│                                                                        │
│  Warning message display for form fields with caution feedback.       │
└────────────────────────────────────────────────────────────────────────┘ */

import { Icon, T } from '@/vr';

export interface LabelWarningProps {
  /** Warning message to display */
  message: string;
  /** Show warning icon */
  showIcon?: boolean;
  /** Warning severity */
  severity?: 'low' | 'medium' | 'high';
  /** Animation type */
  animation?: 'none' | 'slide' | 'fade' | 'pulse';
  /** Additional className */
  className?: string;
}

/**
 * LabelWarning - Warning message display
 * TTT Gap Model compliant - no external margins
 */
export default function LabelWarning({
  message,
  showIcon = true,
  severity = 'medium',
  animation = 'slide',
  className = ''
}: LabelWarningProps) {
  const classes = [
    'vr-label-warning',
    `vr-label-warning--${severity}`,
    animation !== 'none' && `vr-label-warning--${animation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert" aria-live="polite">
      {showIcon && (
        <Icon
          variant="warning"
          size="sm"
          className="vr-label-warning-icon"
        />
      )}
      <T.body size="sm" className="vr-label-warning-message">
        {message}
      </T.body>
    </div>
  );
}
