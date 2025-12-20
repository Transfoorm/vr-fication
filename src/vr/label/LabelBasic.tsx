/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Label Basic                                        │
│  /src/prebuilts/label/Basic.tsx                                        │
│                                                                        │
│  Consistent form field labels across the app.                         │
└────────────────────────────────────────────────────────────────────────┘ */

import { T } from '@/vr';

export interface LabelBasicProps {
  /** Label text (use either children or text) */
  children?: React.ReactNode;
  /** Label text (alternative to children) */
  text?: string;
  /** HTML for attribute */
  htmlFor?: string;
  /** Required field indicator */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * LabelBasic - Consistent form field labels
 * TTT Gap Model compliant - no external margins
 */
export default function LabelBasic({
  children,
  text,
  htmlFor,
  required = false,
  disabled = false,
  className = ''
}: LabelBasicProps) {
  const classes = [
    'vr-label-basic',
    required && 'vr-label-basic--required',
    disabled && 'vr-label-basic--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <label htmlFor={htmlFor} className={classes}>
      <T.body size="sm">
        {children || text}
      </T.body>
    </label>
  );
}
