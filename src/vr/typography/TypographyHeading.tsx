/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Typography Heading                                 │
│  /src/vr/typography/heading/index.tsx                │
│                                                                        │
│  Subsection headings with consistent styling.                        │
└────────────────────────────────────────────────────────────────────────┘ */

import React from 'react';

export interface TypographyHeadingProps {
  /** Heading content */
  children: React.ReactNode;
  /** Heading level - defines semantics, size, AND default weight */
  level?: 2 | 3 | 4 | 5 | 6;
  /** Weight variant (overrides level default) */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Optional className for domain-specific styling */
  className?: string;
}

// Pure System: Each level has its own default weight
const LEVEL_DEFAULTS: Record<number, 'normal' | 'medium' | 'semibold' | 'bold'> = {
  2: 'bold',      // h2 = Most prominent subsection
  3: 'semibold',  // h3 = Standard section heading (most common)
  4: 'medium',    // h4 = Smaller section
  5: 'normal',    // h5 = Minor heading
  6: 'normal',    // h6 = Minor heading
};

/**
 * Typography.heading - Section hierarchy (h2-h6)
 * Pure system: level defines semantics, size, AND default weight
 * TTT Gap Model compliant - no external margins
 */
export default function TypographyHeading({
  children,
  level = 3,
  weight,
  className
}: TypographyHeadingProps) {
  const finalWeight = weight ?? LEVEL_DEFAULTS[level];

  const classes = [
    'vr-typography-heading',
    `vr-typography-heading--${level}`,
    `vr-typography-heading--${finalWeight}`,
    className
  ].filter(Boolean).join(' ');

  const Tag = `h${level}` as React.ElementType;

  return (
    <Tag className={classes}>
      {children}
    </Tag>
  );
}
