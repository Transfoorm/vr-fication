/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Typography Caption                                 │
│  /src/vr/typography/caption/index.tsx                │
│                                                                        │
│  Small caption and helper text with consistent styling.               │
└────────────────────────────────────────────────────────────────────────┘ */

export interface TypographyCaptionProps {
  /** Caption content */
  children: React.ReactNode;
  /** Size variant */
  size?: 'xs' | 'sm';
  /** Weight variant */
  weight?: 'normal' | 'medium';
  /** Text color variant */
  color?: 'primary' | 'secondary' | 'tertiary' | 'muted';
  /** Style variant */
  italic?: boolean;
  /** Optional className for domain-specific styling */
  className?: string;
}

/**
 * Typography.caption - Small caption and helper text
 * TTT Gap Model compliant - no external margins
 */
export default function TypographyCaption({
  children,
  size = 'sm',
  weight = 'normal',
  color = 'tertiary',
  italic = false,
  className
}: TypographyCaptionProps) {
  const classes = [
    'vr-typography-caption',
    `vr-typography-caption--${size}`,
    `vr-typography-caption--${weight}`,
    `vr-typography-caption--${color}`,
    italic && 'vr-typography-caption--italic',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
