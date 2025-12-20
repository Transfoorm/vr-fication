/**──────────────────────────────────────────────────────────────────────┐
│  🔱 USERS - Sovereign Domain                                           │
│  /src/app/domains/admin/users/Users.tsx                                │
│                                                                        │
│  VR Doctrine: Domain Layer (Clean)                                     │
│  - Page route and structure only                                       │
│  - Imports Feature (UsersPageTabsFeature)                              │
│  - No FUSE wiring, no business logic                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { UsersTabsFeature } from '@/features/admin/users-tabs';

export default function Users() {
  useSetPageHeader("User Management", 'View, ammend, delete or invite users');
  usePageTiming('/admin/users');

  return <UsersTabsFeature />;
}
