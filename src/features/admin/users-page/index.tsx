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
import { Tabs, Stack } from '@/vr';
import { ActiveUsersFeature } from './_tabs/ActiveUsersTab';
import { DeletedUsersFeature } from './_tabs/DeletedUsersTab';
import { InvitesFeature } from './_tabs/InvitesTab';
import { StatusTabFeature } from './_tabs/StatusTab';

export function UsersTabsFeature() {
  // 🔄 Real-time sync: Convex → FUSE (live subscription)
  useAdminSync();

  // 🚀 WARP: Get counts from FUSE store (server-preloaded)
  const { computed } = useAdminData();

  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'active', label: 'Active Users', count: computed.usersCount, content: <ActiveUsersFeature /> },
          { id: 'deleted', label: 'Deleted Users', count: computed.deletionLogsCount, content: <DeletedUsersFeature /> },
          { id: 'invite', label: 'Invite Users', content: <InvitesFeature /> },
          { id: 'status', label: 'Status', content: <StatusTabFeature /> }
        ]}
      />
    </Stack>
  );
}
