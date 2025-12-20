/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ GOLDEN BRIDGE HOOK - Settings Domain                              │
│  /src/hooks/useSettingsData.ts                                         │
│                                                                        │
│  Clean API for accessing settings domain data                          │
│  Abstracts FUSE store complexity from components                       │
│  Following proven _T2 Golden Bridge pattern                            │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';

/**
 * Golden Bridge Hook - Settings Domain
 *
 * Provides clean, domain-specific API for components
 * Hides FUSE store structure and complexity
 * Following WRAP pattern: { data, computed, actions, flags }
 *
 * Usage:
 * ```tsx
 * const { data, computed, flags } = useSettingsData();
 * const { userProfile, preferences, notifications } = data;
 * const { hasProfile } = computed;
 * const { isHydrated } = flags;
 * ```
 */
export function useSettingsData() {
  const settings = useFuse((state) => state.settings);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = settings.status === 'hydrated';

  return {
    // DATA: Raw domain data
    data: {
      userProfile: settings.userProfile,
      preferences: settings.preferences,
      notifications: settings.notifications,
    },

    // COMPUTED: Calculated values from data
    computed: {
      hasProfile: !!settings.userProfile,
      preferencesCount: settings.preferences.length,
      notificationsCount: settings.notifications.length,
    },

    // ACTIONS: Mutations and operations (add as needed)
    actions: {
      // Future: Add mutations here
      // updatePreference: (id, updates) => store.updatePreference(id, updates),
    },

    // FLAGS: Hydration and state flags
    flags: {
      isHydrated,
      isLoading: false, // Always false with WARP preloading
    },
  };
}
