/**──────────────────────────────────────────────────────────────────────┐
│  🗄️ DB CHECK FEATURE                                                  │
│  /src/features/admin/database/db-check/index.tsx                     │
│                                                                        │
│  VR Doctrine: Feature Layer                                          │
│  - Wires FUSE (admin data for user count and ClerkRegistry count)    │
│  - Displays DB integrity check with Card.standard VR                 │
│  - The sponge that absorbs all FUSE wiring                           │
│                                                                        │
│  TTTS-2 COMPLIANT: Reads from FUSE only (NO useQuery)                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './db-check.css';
import { Card, T } from '@/prebuilts';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminSync } from '@/hooks/useAdminSync';

export function DBCheckFeature() {
  // 🔄 Real-time sync: Convex → FUSE (live subscription)
  useAdminSync();

  // 🛡️ GOLDEN BRIDGE: Read from FUSE (data preloaded via WARP/PRISM)
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
        <div className="ft-dbcheck-status">
          <div className="ft-dbcheck-indicator">
            <div className="ft-dbcheck-light ft-dbcheck-light--green" />
            <T.body size="sm" color="success" weight="medium">
              Database records reflect that the &apos;delete user cascade&apos; is balanced
            </T.body>
          </div>

          <T.body size="sm" color="secondary">
            Active Users <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{usersCount}</T.caption> • Convex Document: <span className="ft-dbcheck-dbname">admin_users</span>
          </T.body>
          <T.body size="sm" color="secondary">
            Clerk Registry <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{clerkRegistryCount}</T.caption> • Convex Document: <span className="ft-dbcheck-dbname">admin_users_ClerkRegistry</span>
          </T.body>
        </div>
      ) : (
        <div className="ft-dbcheck-status">
          <div className="ft-dbcheck-indicator ft-dbcheck-indicator--error">
            <div className="ft-dbcheck-light ft-dbcheck-light--red" />
            <T.body size="sm" color="error" weight="medium">
              There are more Clerk records than there are users. Please check your database.
            </T.body>
          </div>

          <T.body size="sm" color="secondary">
            Active Users <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{usersCount}</T.caption> • Convex Document: <span className="ft-dbcheck-dbname">admin_users</span>
          </T.body>
          <T.body size="sm" color="secondary">
            Clerk Registry <T.caption size="xs" weight="medium" className="vr-tabs-panels-tab-count">{clerkRegistryCount}</T.caption> • Convex Document: <span className="ft-dbcheck-dbname">admin_users_ClerkRegistry</span>
          </T.body>
        </div>
      )}
    </Card.standard>
  );
}
