/**──────────────────────────────────────────────────────────────────────┐
│  🔄 SETTINGS SYNC HOOK - Convex → FUSE Bridge                        │
│  /src/hooks/useSettingsSync.ts                                        │
│                                                                        │
│  TTTS-2 COMPLIANT: useQuery ONLY hydrates FUSE.                       │
│  This hook syncs Convex data INTO FUSE - never returns directly.      │
│                                                                        │
│  Used by: SettingsProvider                                             │
│  Components read via: useSettingsData()                               │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';

/**
 * Settings Sync Hook - Convex → FUSE
 *
 * GOLDEN BRIDGE PATTERN:
 * - Subscribes to Convex via useQuery
 * - Hydrates FUSE store via hydrateSettings()
 * - Returns NOTHING (void)
 * - Components read from FUSE via useSettingsData()
 */
export function useSettingsSync(): void {
  const hydrateSettings = useFuse((state) => state.hydrateSettings);
  const settingsStatus = useFuse((state) => state.settings.status);
  const user = useFuse((state) => state.user);

  // 🛡️ S.I.D. Phase 15: Pass callerUserId (sovereign) to queries
  const callerUserId = user?.id as Id<"admin_users"> | undefined;

  // Convex WebSocket subscription for real-time updates
  const settingsData = useQuery(
    api.domains.settings.api.getUserSettings,
    callerUserId ? { callerUserId } : "skip"
  );

  // SYNC TO FUSE: When Convex data arrives, hydrate FUSE store
  useEffect(() => {
    if (settingsData) {
      // 🛡️ S.I.D. Phase 15: Add clerkId from FUSE user state to profile
      hydrateSettings({
        userProfile: {
          ...settingsData.userProfile,
          clerkId: user?.clerkId || '', // Preserve clerkId from FUSE state
        },
        preferences: settingsData.preferences || [],
        notifications: settingsData.notifications || [],
      }, 'CONVEX_LIVE');
      console.log('⚙️ SETTINGS SYNC: Data synced to FUSE via CONVEX_LIVE');
    }
  }, [settingsData, hydrateSettings, user?.clerkId]);

  // Log initial hydration status
  useEffect(() => {
    if (settingsStatus === 'hydrated') {
      console.log('⚙️ SETTINGS SYNC: FUSE store is hydrated');
    }
  }, [settingsStatus]);
}
