/**──────────────────────────────────────────────────────────────────────┐
│  🔱 SECURITY TAB - Pure Declaration                                   │
│  /src/app/domains/settings/account/_tabs/Security.tsx                │
│                                                                       │
│  VR Doctrine: Tab Layer                                               │
│  - Feature imports only                                               │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
│                                                                       │
│  SOVEREIGNTY: No Clerk imports in domains - Golden Bridge enforced    │
└────────────────────────────────────────────────────────────────────────┘ */

import { PasswordFields } from '@/features/account/password-tab';

export default function Security() {
  return <PasswordFields />;
}
