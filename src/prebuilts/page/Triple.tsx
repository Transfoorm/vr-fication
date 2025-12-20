/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Triple Page                                       │
│  /src/components/prebuilts/page/triple/index.tsx                      │
│                                                                        │
│  33/33/33 three-column layout. Equal distribution. Responsive stack.  │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.triple>                                                        │
│    <LeftContent />                                                    │
│    <CenterContent />                                                  │
│    <RightContent />                                                   │
│  </Page.triple>                                                       │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode, Children } from 'react';

export interface TriplePageProps {
  children: ReactNode;
  className?: string;
}

/**
 * TriplePage - Three-column equal layout
 *
 * Features:
 * - Exactly 3 equal columns (33/33/33)
 * - Responsive: stacks vertically on mobile
 * - Consistent gap between columns
 *
 * Perfect for:
 * - Feature comparison (3 plans/tiers)
 * - Step-by-step processes (1-2-3)
 * - Before/During/After
 * - Past/Present/Future
 * - Form fields in a row
 *
 * IMPORTANT: Expects exactly 3 children
 */
export default function TriplePage({
  children,
  className = ''
}: TriplePageProps) {
  const childArray = Children.toArray(children);

  // Warn in development if not exactly 3 children
  if (process.env.NODE_ENV === 'development' && childArray.length !== 3) {
    console.warn(
      `TriplePage expects exactly 3 children, received ${childArray.length}. ` +
      'Only first 3 will be displayed.'
    );
  }

  return (
    <div className={`vr-page vr-page-triple ${className}`}>
      <div className="vr-page-triple-triple-left">{childArray[0]}</div>
      <div className="vr-page-triple-triple-center">{childArray[1]}</div>
      <div className="vr-page-triple-triple-right">{childArray[2]}</div>
    </div>
  );
}

/**
 * Helper components for semantic markup
 */
export function TripleLeft({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`triple-left ${className}`}>{children}</div>;
}

export function TripleCenter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`triple-center ${className}`}>{children}</div>;
}

export function TripleRight({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`triple-right ${className}`}>{children}</div>;
}
