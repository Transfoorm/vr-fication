/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Constrained Page                                  │
│  /src/vr/page/Constrained.tsx                                         │
│                                                                        │
│  Width-constrained centered layout. 1320px max. Enterprise perfect.   │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/vr';                                          │
│  <Page.constrained>                                                   │
│    <DataTable />                                                      │
│  </Page.constrained>                                                  │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

export interface ConstrainedPageProps {
  children?: ReactNode;
  className?: string;
}

export default function ConstrainedPage({
  children,
  className = ''
}: ConstrainedPageProps) {
  return (
    <div className={`vr-page vr-page-constrained ${className}`}>
      {children}
    </div>
  );
}
