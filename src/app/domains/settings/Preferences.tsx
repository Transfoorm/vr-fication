/**──────────────────────────────────────────────────────────────────────┐
│  🔱 PREFERENCES - Sovereign Domain                                     │
│  /src/app/domains/settings/Preferences.tsx                             │
│                                                                        │
│  VR Doctrine: Domain Layer (Flat)                                      │
│  - 4 concerns only: header, timing, layout, feature                    │
│  - No _tabs/ (tabs belong to features)                                 │
│  - No FUSE, no callbacks, no state                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { PreferencesPageFeature } from '@/features/settings/preferences-page';
import { Page } from '@/vr';

export default function Preferences() {
  useSetPageHeader('Preferences', 'Customize your experience');
  usePageTiming('/settings/preferences');

  return (
    <Page.constrained>
      <PreferencesPageFeature />
    </Page.constrained>
  );
}
