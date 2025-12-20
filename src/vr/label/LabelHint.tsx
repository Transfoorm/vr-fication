/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Label Hint                                         │
│  /src/vr/label/Hint.tsx                                         │
│                                                                        │
│  Helpful hint text for form fields with subtle styling.               │
└────────────────────────────────────────────────────────────────────────┘ */

import { Icon, T } from '@/vr';

export interface LabelHintProps {
  /** Hint text to display */
  text: string;
  /** Show info icon */
  showIcon?: boolean;
  /** Position relative to field */
  position?: 'below' | 'inline' | 'tooltip';
  /** Additional className */
  className?: string;
}

/**
 * LabelHint - Helpful hint/description text
 * TTT Gap Model compliant - no external margins
 */
export default function LabelHint({
  text,
  showIcon = false,
  position = 'below',
  className = ''
}: LabelHintProps) {
  const classes = [
    'vr-label-hint',
    `vr-label-hint--${position}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {showIcon && (
        <Icon variant="info" size="xs" className="vr-label-hint-icon" />
      )}
      {position === 'inline' ? (
        <T.caption size="xs" className="vr-label-hint-text">
          {text}
        </T.caption>
      ) : (
        <T.body size="sm" className="vr-label-hint-text">
          {text}
        </T.body>
      )}
    </div>
  );
}
