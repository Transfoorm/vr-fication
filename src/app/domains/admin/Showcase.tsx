/**──────────────────────────────────────────────────────────────────────┐
│  🔱 SHOWCASE - Sovereign Domain                                        │
│  /src/app/domains/admin/Showcase.tsx                                   │
│                                                                        │
│  VR Doctrine: Domain Layer (Flat)                                      │
│  - 4 concerns only: header, timing, layout, feature                    │
│  - No _tabs/ (tabs belong to features)                                 │
│  - No FUSE, no callbacks, no state                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { ShowcasePageFeature } from '@/features/admin/showcase-page';
import { Page } from '@/vr';

export default function Showcase() {
  useSetPageHeader('Showcase', 'Variant Robots (VR) - Discover the sites VR component registry');
  usePageTiming('/admin/showcase');

  return (
    <Page.constrained>
      <ShowcasePageFeature />
    </Page.constrained>
  );
}
