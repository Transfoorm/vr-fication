/**
 * +----------------------------------------------------------------------+
 * |  🤖 VARIANT ROBOT - Stack                                            |
 * |  src/vr/stack/index.tsx                                              |
 * |                                                                      |
 * |  THE sitewide modular spacing system.                                |
 * |  Wrap content in Stack. Use variants as levers. Done.                |
 * |                                                                      |
 * |  VR Doctrine: "Need spacing? There's a VR for that!"                 |
 * +----------------------------------------------------------------------+
 */

import { ReactNode } from 'react';

export interface StackProps {
  children: ReactNode;
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────
   VERTICAL VARIANTS (smallest → largest)
   ───────────────────────────────────────────────────────────────────── */

/** 4px gaps - Micro spacing (label + input, icon + text) */
const StackXs = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-xs ${className}`.trim()}>{children}</div>
);

/** 8px gaps - Tight grouping (related items, compact lists) */
const StackSm = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-sm ${className}`.trim()}>{children}</div>
);

/** 16px gaps - Standard spacing (default for most content) */
const StackMd = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-md ${className}`.trim()}>{children}</div>
);

/** 24px gaps - Generous spacing (cards, form sections) */
const StackLg = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-lg ${className}`.trim()}>{children}</div>
);

/** 32px gaps - Loose spacing (distinct sections) */
const StackXl = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-xl ${className}`.trim()}>{children}</div>
);

/** 48px gaps - Section breaks (major page divisions) */
const StackSection = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-section ${className}`.trim()}>{children}</div>
);

/* ─────────────────────────────────────────────────────────────────────
   HORIZONTAL VARIANTS
   ───────────────────────────────────────────────────────────────────── */

/** Horizontal row layout with 16px gaps, natural widths */
const StackRow = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-row ${className}`.trim()}>{children}</div>
);

/** Horizontal row with equal-width children (forms, field pairs) */
const StackRowEqual = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-row-equal ${className}`.trim()}>{children}</div>
);

/* ─────────────────────────────────────────────────────────────────────
   COMPOUND EXPORT

   Usage:
     <Stack>           → 16px (default, most content)
     <Stack.xs>        → 4px  (micro)
     <Stack.sm>        → 8px  (tight)
     <Stack.lg>        → 24px (generous)
     <Stack.xl>        → 32px (loose)
     <Stack.section>   → 48px (page divisions)
     <Stack.row>       → horizontal, natural widths
     <Stack.row.equal> → horizontal, equal-width children
   ───────────────────────────────────────────────────────────────────── */

export const Stack = Object.assign(StackMd, {
  xs: StackXs,
  sm: StackSm,
  md: StackMd,
  lg: StackLg,
  xl: StackXl,
  section: StackSection,
  row: Object.assign(StackRow, { equal: StackRowEqual }),
  // Aliases for discoverability
  tight: StackSm,
  loose: StackXl,
  horizontal: StackRow,
});

/* ─────────────────────────────────────────────────────────────────────
   NAMED EXPORTS & TYPES
   ───────────────────────────────────────────────────────────────────── */

export {
  StackXs,
  StackSm,
  StackMd,
  StackLg,
  StackXl,
  StackSection,
  StackRow,
  StackRowEqual,
};
