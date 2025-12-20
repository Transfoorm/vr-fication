/**──────────────────────────────────────────────────────────────────────┐
│  👥 ACTIVE USERS TAB - Pure Declaration                               │
│  /src/app/domains/admin/users/_tabs/ActiveUsers.tsx                   │
│                                                                       │
│  VR Doctrine: Tab Layer                                               │
│  - Feature imports only                                               │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import { ActiveUsersFeature } from '@/features/admin/users-tabs/active-users-tab';

export default function ActiveUsers() {
  return <ActiveUsersFeature />;
}
