/**──────────────────────────────────────────────────────────────────────┐
│  👤 USER DRAWER FEATURE                                               │
│  /src/features/admin/user-drawer/index.tsx                            │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Wires FUSE (admin data by userId)                                  │
│  - Renders Tabs.panels for user details                               │
│  - Used inside SideDrawer when View is clicked                        │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { Tabs, T } from '@/prebuilts';
import { useAdminData } from '@/hooks/useAdminData';
import { ProfileTab } from './_tabs/ProfileTab';
import { EmailTab } from './_tabs/EmailTab';
import { ActivityTab } from './_tabs/ActivityTab';
import './user-drawer.css';

interface UserDetailsFeatureProps {
  userId: string;
}

export function UserDetailsFeature({ userId }: UserDetailsFeatureProps) {
  const [activeTab, setActiveTab] = useState('profile');

  // FUSE wiring - get user from admin data
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);

  if (!user) {
    return <T.body>User not found</T.body>;
  }

  return (
    <Tabs.panels
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={[
        { id: 'profile', label: 'Profile', content: <ProfileTab userId={userId} isActive={activeTab === 'profile'} /> },
        { id: 'email', label: 'Email', content: <EmailTab userId={userId} /> },
        { id: 'activity', label: 'Activity', content: <ActivityTab userId={userId} /> },
      ]}
    />
  );
}
