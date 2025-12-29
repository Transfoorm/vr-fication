/**──────────────────────────────────────────────────────────────────────┐
│  🗄️ CHECKS TAB                                                        │
│  /src/features/system/database-page/_tabs/ChecksTab.tsx               │
│                                                                       │
│  VR Doctrine: Tab Component                                           │
│  - Wires FUSE (admin data for user count and ClerkRegistry count)    │
│  - Displays DB integrity check with Card.standard VR                 │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../database-page.css';
import { Card, T } from '@/vr';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminSync } from '@/hooks/useAdminSync';

export function ChecksTab() {
  // Real-time sync: Convex → FUSE (live subscription)
  useAdminSync();

  // GOLDEN BRIDGE: Read from FUSE (data preloaded via WARP/PRISM)
  const { computed, flags } = useAdminData();

  const usersCount = computed.usersCount;
  const clerkRegistryCount = computed.clerkRegistryCount;

  // Only show error/success when BOTH counts are actually loaded
  // Prevents red flash: 0 means still loading (there's always ≥1 user after login)
  const dataReady = flags.isHydrated
    && usersCount !== undefined
    && clerkRegistryCount !== undefined
    && usersCount > 0
    && clerkRegistryCount > 0;

  if (!dataReady) {
    return (
      <Card.standard
        title="Delete User Cascade"
        subtitle="Database integrity verification"
      >
        <T.body size="sm" color="tertiary">
          Checking database integrity...
        </T.body>
      </Card.standard>
    );
  }

  const countsMatch = usersCount === clerkRegistryCount;

  return (
    <Card.standard
      title="Delete User Cascade"
      subtitle="Database integrity verification"
    >
      {countsMatch ? (
        <div className="ft-database-status">
          <div className="ft-database-indicator">
            <div className="ft-database-light ft-database-light--green" />
            <T.body size="sm" color="success" weight="medium">
              Database records reflect that the &apos;delete user cascade&apos; is balanced and match.
            </T.body>
          </div>

          <div className="ft-database-sunken">
            <T.body size="sm" color="secondary">
              Active Users: <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{usersCount}</T.caption> • Convex Document: <span className="ft-database-dbname">admin_users</span>
            </T.body>
            <T.body size="sm" color="secondary">
              Clerk Registry: <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{clerkRegistryCount}</T.caption> • Convex Document: <span className="ft-database-dbname">admin_users_ClerkRegistry</span>
            </T.body>
          </div>
        </div>
      ) : (
        <div className="ft-database-status">
          <div className="ft-database-indicator ft-database-indicator--error">
            <div className="ft-database-light ft-database-light--red" />
            <T.body size="sm" color="error" weight="medium">
              There are more Clerk records than there are users. Please check your database.
            </T.body>
          </div>

          <div className="ft-database-sunken">
            <T.body size="sm" color="secondary">
              Active Users: <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{usersCount}</T.caption> • Convex Document: <span className="ft-database-dbname">admin_users</span>
            </T.body>
            <T.body size="sm" color="secondary">
              Clerk Registry: <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{clerkRegistryCount}</T.caption> • Convex Document: <span className="ft-database-dbname">admin_users_ClerkRegistry</span>
            </T.body>
          </div>
        </div>
      )}
    </Card.standard>
  );
}
