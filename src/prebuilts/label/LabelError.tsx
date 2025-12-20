/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Label Error                                        │
│  /src/prebuilts/label/Error.tsx                                        │
│                                                                        │
│  Inline error message for form fields with semantic styling.          │
└────────────────────────────────────────────────────────────────────────┘ */

import { Icon, T } from '@/prebuilts';

export interface LabelErrorProps {
  /** Error message to display */
  message: string;
  /** Show error icon */
  showIcon?: boolean;
  /** Animation type */
  animation?: 'none' | 'slide' | 'fade';
  /** Additional className */
  className?: string;
}

/**
 * LabelError - Inline error message display
 * TTT Gap Model compliant - no external margins
 */
export default function LabelError({
  message,
  showIcon = true,
  animation = 'slide',
  className = ''
}: LabelErrorProps) {
  const classes = [
    'vr-label-error',
    animation !== 'none' && `vr-label-error--${animation}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="alert">
      {showIcon && (
        <Icon variant="alert-circle" size="sm" className="vr-label-error-icon" />
      )}
      <T.body size="sm" className="vr-label-error-message">
        {message}
      </T.body>
    </div>
  );
}
