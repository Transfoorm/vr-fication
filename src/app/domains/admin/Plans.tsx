/**──────────────────────────────────────────────────────────────────────┐
│  🔱 PLANS - Sovereign Domain                                           │
│  /src/app/domains/admin/Plans.tsx                                      │
│                                                                        │
│  VR Doctrine: Domain Layer (Flat)                                      │
│  - 4 concerns only: header, timing, layout, feature                    │
│  - No _tabs/ (tabs belong to features)                                 │
│  - No FUSE, no callbacks, no state                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { Page, T } from '@/vr';

export default function Plans() {
  useSetPageHeader('Plans', 'Coming soon');
  usePageTiming('/admin/plans');

  return (
    <Page.constrained>
      <T.body>Plans coming soon</T.body>
    </Page.constrained>
  );
}
