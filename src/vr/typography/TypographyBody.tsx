/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Typography Body                                    │
│  /src/vr/typography/body/index.tsx                   │
│                                                                        │
│  Body text with consistent styling.                                   │
└────────────────────────────────────────────────────────────────────────┘ */

export interface TypographyBodyProps {
  /** Body content */
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Weight variant */
  weight?: 'normal' | 'medium' | 'semibold';
  /** Text color variant */
  color?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
  /** Optional className for domain-specific styling */
  className?: string;
}

/**
 * Typography.body - Regular body text
 * TTT Gap Model compliant - no external margins
 */
export default function TypographyBody({
  children,
  size = 'md',
  weight = 'normal',
  color = 'primary',
  className
}: TypographyBodyProps) {
  const classes = [
    'vr-typography-body',
    `vr-typography-body--${size}`,
    `vr-typography-body--${weight}`,
    `vr-typography-body--${color}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <p className={classes}>
      {children}
    </p>
  );
}
