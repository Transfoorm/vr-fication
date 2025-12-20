/**──────────────────────────────────────────────────────────────────────┐
│  🔱 USERS TABS FEATURE                                                │
│  /src/features/admin/users-tabs/index.tsx                            │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  - Wires FUSE (useAdminData for tab counts, useAdminSync for live)   │
│  - Imports VRs (Stack, Tabs.panels)                                  │
│  - Wraps tab content (ActiveUsers, DeletedUsers, Invites Features)   │
│  - The sponge that absorbs FUSE wiring from Domain                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useAdminData } from '@/hooks/useAdminData';
import { useAdminSync } from '@/hooks/useAdminSync';
import { Tabs, Stack } from '@/prebuilts';
import ActiveUsers from '@/app/domains/admin/users/_tabs/ActiveUsers';
import DeletedUsers from '@/app/domains/admin/users/_tabs/DeletedUsers';
import Invites from '@/app/domains/admin/users/_tabs/Invites';
import Status from '@/app/domains/admin/users/_tabs/Status';

export function UsersTabsFeature() {
  // 🔄 Real-time sync: Convex → FUSE (live subscription)
  useAdminSync();

  // 🚀 WARP: Get counts from FUSE store (server-preloaded)
  const { computed } = useAdminData();

  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users', count: computed.usersCount, content: <ActiveUsers /> },
          { id: 'deleted', label: 'Deleted Users', count: computed.deletionLogsCount, content: <DeletedUsers /> },
          { id: 'invite', label: 'Invite Users', content: <Invites /> },
          { id: 'status', label: 'Status', content: <Status /> }
        ]}
      />
    </Stack>
  );
}
