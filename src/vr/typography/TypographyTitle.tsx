/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Typography Title                                   │
│  /src/vr/typography/title/index.tsx                  │
│                                                                        │
│  Page and section titles with consistent styling.                     │
└────────────────────────────────────────────────────────────────────────┘ */

export interface TypographyTitleProps {
  /** Title content */
  children: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Weight variant */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Text alignment */
  align?: 'left' | 'center' | 'right' | 'justify';
  /** Optional className for domain-specific styling */
  className?: string;
}

/**
 * Typography.title - Page and section titles
 * TTT Gap Model compliant - no external margins
 */
export default function TypographyTitle({
  children,
  size = 'lg',
  weight = 'semibold',
  align = 'left',
  className
}: TypographyTitleProps) {
  const classes = [
    'vr-typography-title',
    `vr-typography-title--${size}`,
    `vr-typography-title--${weight}`,
    `vr-typography-title--${align}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <h1 className={classes}>
      {children}
    </h1>
  );
}
