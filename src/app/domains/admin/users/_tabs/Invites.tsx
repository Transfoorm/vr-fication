/**──────────────────────────────────────────────────────────────────────┐
│  🎟️ INVITES TAB - Pure Declaration                                    │
│  /src/app/domains/admin/users/_tabs/Invites.tsx                       │
│                                                                       │
│  VR Doctrine: Tab Layer                                               │
│  - Feature imports only                                               │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { InvitesFeature } from '@/features/admin/users-page/_tabs/InvitesTab';

export default function Invites() {
  return <InvitesFeature />;
}
