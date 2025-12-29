/**──────────────────────────────────────────────────────────────────────┐
│  🔱 ACCOUNT - Sovereign Domain                                         │
│  /src/app/domains/settings/Account.tsx                                 │
│                                                                        │
│  VR Doctrine: Domain Layer (Flat)                                      │
│  - 4 concerns only: header, timing, layout, feature                    │
│  - No _tabs/ (tabs belong to features)                                 │
│  - No FUSE, no callbacks, no state                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { AccountPageFeature } from '@/features/settings/account-page';
import { Page } from '@/vr';

export default function Account() {
  useSetPageHeader('Manage Your Account', 'These are your account details and settings');
  usePageTiming('/settings/account');

  return (
    <Page.constrained>
      <AccountPageFeature />
    </Page.constrained>
  );
}
