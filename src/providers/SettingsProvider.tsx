/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ SETTINGS PROVIDER - GOLDEN BRIDGE COMPLIANT                     │
│  /src/providers/SettingsProvider.tsx                                   │
│                                                                        │
│  TTTS-2: Hydrates FUSE via WARP + real-time sync.                     │
│  Components read from FUSE only via useSettingsData().                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import { useSettingsSync } from '@/hooks/useSettingsSync';
import type { SettingsSlice } from '@/store/types';

interface SettingsProviderProps {
  children: ReactNode;
  initialData?: Partial<SettingsSlice>;
}

/**
 * SettingsProvider - Hydrates settings domain with WARP + real-time sync
 *
 * GOLDEN BRIDGE PATTERN:
 * 1. WARP preload: SSR hydration via initialData
 * 2. Real-time sync: useSettingsSync() keeps FUSE fresh
 * 3. Components read: useSettingsData() → FUSE only
 */
export function SettingsProvider({ children, initialData }: SettingsProviderProps) {
  const hydrateSettings = useFuse((state) => state.hydrateSettings);

  // Real-time sync: Convex → FUSE (TTTS-2 compliant)
  useSettingsSync();

  useEffect(() => {
    // SSR hydration (WARP preload)
    if (initialData?.userProfile) {
      console.log('⚙️ SettingsProvider: Hydrating settings domain from WARP');
      hydrateSettings(initialData, 'WARP');
    }
  }, [hydrateSettings, initialData]);

  return <>{children}</>;
}
