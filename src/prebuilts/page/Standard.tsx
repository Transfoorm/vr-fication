/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Standard Page                                      │
│  /src/components/prebuilts/page/standard/index.tsx                     │
│                                                                        │
│  Default page layout with enterprise padding.                          │
│  Clean, professional, content-focused.                                 │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.standard>                                                      │
│    {content}                                                          │
│  </Page.standard>                                                     │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

export interface StandardPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * StandardPage - Enterprise default layout
 *
 * Features:
 * - Consistent content padding (40px sides, 40px bottom)
 * - Maximum readability width constraint
 * - Professional spacing optimized for business content
 *
 * Perfect for:
 * - Form pages
 * - Settings pages
 * - Documentation
 * - General content pages
 */
export default function StandardPage({
  children,
  className = ''
}: StandardPageProps) {
  return (
    <div className={`vr-page vr-page-standard ${className}`}>
      {children}
    </div>
  );
}