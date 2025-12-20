/**──────────────────────────────────────────────────────────────────────┐
│  🔱 EMAIL TAB - Pure Declaration                                      │
│  /src/app/domains/settings/account/_tabs/Email.tsx                    │
│                                                                       │
│  VR Doctrine: Tab Layer                                               │
│  - One line import                                                    │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
│                                                                       │
│  SOVEREIGNTY: No Clerk imports in domains - Golden Bridge enforced    │
└────────────────────────────────────────────────────────────────────────┘ */

import { EmailFields } from '@/features/account/email-tab';

export default function Email() {
  return <EmailFields />;
}
