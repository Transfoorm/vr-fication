/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Typography Hero                                    │
│  /src/vr/typography/TypographyHero.tsx                          │
│                                                                        │
│  Hero headlines - exceptionally large text for landing pages.         │
│  Fixed at 48px (3rem) for maximum impact.                             │
└────────────────────────────────────────────────────────────────────────┘ */

export interface TypographyHeroProps {
  /** Hero content */
  children: React.ReactNode;
  /** Weight variant */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Optional className for domain-specific styling */
  className?: string;
}

/**
 * Typography.hero - Hero headlines (48px)
 * TTT Gap Model compliant - no external margins
 */
export default function TypographyHero({
  children,
  weight = 'bold',
  className
}: TypographyHeroProps) {
  const classes = [
    'vr-typography-hero',
    `vr-typography-hero--${weight}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <h1 className={classes}>
      {children}
    </h1>
  );
}
