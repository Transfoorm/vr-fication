/**──────────────────────────────────────────────────────────────────────┐
│  🔱 USERS - Sovereign Domain                                           │
│  /src/app/domains/admin/Users.tsx                                      │
│                                                                        │
│  VR Doctrine: Domain Layer (Flat)                                      │
│  - 4 concerns only: header, timing, layout, feature                    │
│  - No _tabs/ (tabs belong to features)                                 │
│  - No FUSE, no callbacks, no state                                     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { UsersTabsFeature } from '@/features/admin/users-page';
import { Page } from '@/vr';

export default function Users() {
  useSetPageHeader("User Management", 'View, ammend, delete or invite users');
  usePageTiming('/admin/users');

  return (
    <Page.constrained>
      <UsersTabsFeature />
    </Page.constrained>
  );
}
