/**──────────────────────────────────────────────────────────────────────┐
│  🔱 ACCOUNT - Sovereign Domain                                        │
│  /src/app/domains/settings/account/Account.tsx                        │
│                                                                        │
│  VR Doctrine: Page Layer                                               │
│  - Feature imports only                                                │
│  - ZERO FUSE                                                           │
│  - ZERO callbacks                                                      │
│  - ZERO state                                                          │
│  - Pure declaration                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { AccountPageFeature } from '@/features/account/account-page';

export default function Account() {
  useSetPageHeader('Manage Your Account', 'These are your account details and settings');
  usePageTiming('/settings/account');

  return <AccountPageFeature />;
}
