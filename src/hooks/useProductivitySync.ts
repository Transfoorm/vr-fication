/**─────────────────────────────────────────────────────────────────────────┐
│  🌉 GOLDEN BRIDGE - Productivity Domain Sync Hook                         │
│  /src/hooks/useProductivitySync.ts                                        │
│                                                                           │
│  TTTS-2 COMPLIANT: Convex → FUSE Bridge                                   │
│  - useQuery hydrates FUSE store                                           │
│  - Components read via useProductivityData()                              │
│  - NO direct data returns                                                 │
│                                                                           │
│  Exempt from TTTS-7 (no-runtime-debt): Sync hooks are infrastructure      │
└───────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useFuse } from '@/store/fuse';
import type { EmailAccount } from '@/features/productivity/email-console/types';

/**
 * Productivity Domain Sync Hook
 *
 * Bridges Convex live data → FUSE store for productivity domain.
 * This hook runs in ProductivityProvider to keep FUSE hydrated.
 *
 * GOLDEN BRIDGE PATTERN:
 * - Sync hook: useQuery() → FUSE (this file)
 * - Reader hook: FUSE → components (useProductivityData.ts)
 * - Components: Never call useQuery directly
 */
export function useProductivitySync(): void {
  const hydrateProductivity = useFuse((state) => state.hydrateProductivity);
  const user = useFuse((state) => state.user);
  const callerUserId = user?.convexId as Id<'admin_users'> | undefined;

  // 🌉 GOLDEN BRIDGE: Live query from Convex
  const liveEmailAccounts = useQuery(
    api.domains.productivity.queries.listEmailAccounts,
    callerUserId ? { callerUserId } : 'skip'
  );

  // Hydrate FUSE when Convex data updates
  useEffect(() => {
    if (liveEmailAccounts) {
      const accounts: EmailAccount[] = liveEmailAccounts.map((account) => ({
        _id: account._id,
        label: account.label,
        emailAddress: account.emailAddress,
        provider: account.provider as 'outlook' | 'gmail',
        status: account.status as 'active' | 'error' | 'disconnected',
        syncEnabled: account.syncEnabled,
        connectedAt: account.connectedAt,
        lastSyncAt: account.lastSyncAt,
        lastSyncError: account.lastSyncError,
      }));

      hydrateProductivity({
        email: { threads: [], messages: [], accounts },
      }, 'CONVEX_LIVE');
    }
  }, [liveEmailAccounts, hydrateProductivity]);
}
