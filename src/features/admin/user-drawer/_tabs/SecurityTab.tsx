/**──────────────────────────────────────────────────────────────────────┐
│  🔒 SECURITY TAB                                                      │
│  /src/features/admin/user-drawer/_tabs/SecurityTab.tsx                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { Stack, Badge, T } from '@/vr';
import { useAdminData } from '@/hooks/useAdminData';
import type { RankType } from '@/vr/badge/Rank';

interface SecurityTabProps {
  userId: string;
}

export function SecurityTab({ userId }: SecurityTabProps) {
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);

  if (!user) return <T.body>User not found</T.body>;

  return (
    <Stack>
      <div><T.body><strong>Rank:</strong> <Badge.rank rank={user.rank as RankType} /></T.body></div>
      <div className="ft-user-details-coming-soon"><T.body>Security settings coming soon...</T.body></div>
    </Stack>
  );
}
