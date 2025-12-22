/**──────────────────────────────────────────────────────────────────────┐
│  🔍 STATUS TAB - Pure Declaration                                    │
│  /src/app/domains/admin/users/_tabs/Status.tsx                       │
│                                                                       │
│  VR Doctrine: Tab Layer                                              │
│  - Feature import only                                               │
│  - ZERO FUSE                                                         │
│  - ZERO callbacks                                                    │
│  - ZERO state                                                        │
│  - Pure declaration                                                  │
└────────────────────────────────────────────────────────────────────────┘ */

import { StatusTabFeature } from '@/features/admin/users-page/_tabs/StatusTab';

export default function Status() {
  return <StatusTabFeature />;
}
