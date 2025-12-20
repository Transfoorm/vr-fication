/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Split Page                                         │
│  /src/components/prebuilts/page/split/index.tsx                        │
│                                                                        │
│  50/50 two-column layout. Perfect symmetry. Responsive stacking.       │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.split>                                                         │
│    <LeftContent />                                                    │
│    <RightContent />                                                   │
│  </Page.split>                                                        │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode, Children } from 'react';

export interface SplitPageProps {
  children: ReactNode;
  className?: string;
  /**
   * Reverse the columns on mobile
   * @default false
   */
  reverseOnMobile?: boolean;
}

/**
 * SplitPage - Two-column 50/50 layout
 *
 * Features:
 * - Exactly 2 equal columns
 * - Responsive: stacks vertically on mobile
 * - Consistent gap between columns
 * - Optional reverse stacking on mobile
 *
 * Perfect for:
 * - Before/After comparisons
 * - Feature explanations (text + image)
 * - Pros/Cons lists
 * - Code examples with output
 * - Form with preview
 *
 * IMPORTANT: Expects exactly 2 children
 */
export default function SplitPage({
  children,
  className = '',
  reverseOnMobile = false
}: SplitPageProps) {
  const childArray = Children.toArray(children);

  // Warn in development if not exactly 2 children
  if (process.env.NODE_ENV === 'development' && childArray.length !== 2) {
    console.warn(
      `SplitPage expects exactly 2 children, received ${childArray.length}. ` +
      'Only first 2 will be displayed.'
    );
  }

  const reverseClass = reverseOnMobile ? 'reverse-mobile' : '';

  return (
    <div className={`vr-page vr-page-split ${reverseClass} ${className}`}>
      <div className="vr-page-split-split-left">{childArray[0]}</div>
      <div className="vr-page-split-split-right">{childArray[1]}</div>
    </div>
  );
}

/**
 * Helper components for semantic markup
 */
export function SplitLeft({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`split-left ${className}`}>{children}</div>;
}

export function SplitRight({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`split-right ${className}`}>{children}</div>;
}