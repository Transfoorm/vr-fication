/**──────────────────────────────────────────────────────────────────────┐
│  🛡️ ADMIN PROVIDER - GOLDEN BRIDGE COMPLIANT                        │
│  /src/providers/AdminProvider.tsx                                      │
│                                                                        │
│  TTTS-2: Hydrates FUSE via WARP + real-time sync.                     │
│  Components read from FUSE only via useAdminData().                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import { useAdminSync } from '@/hooks/useAdminSync';
import type { AdminSlice } from '@/store/types';

interface AdminProviderProps {
  children: ReactNode;
  initialData?: Partial<AdminSlice>;
}

/**
 * Preload user avatar and brand logo images into browser cache
 */
function preloadUserImages(users: Array<Record<string, unknown>>) {
  const imageUrls: string[] = [];

  users.forEach((user) => {
    if (user.avatarUrl && typeof user.avatarUrl === 'string') {
      imageUrls.push(user.avatarUrl);
    }
    if (user.brandLogoUrl && typeof user.brandLogoUrl === 'string') {
      imageUrls.push(user.brandLogoUrl);
    }
  });

  // Preload all images in parallel
  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });

  if (imageUrls.length > 0) {
    console.log(`🖼️ AdminProvider: Preloading ${imageUrls.length} user images`);
  }
}

/**
 * AdminProvider - Hydrates admin domain with WARP + real-time sync
 *
 * GOLDEN BRIDGE PATTERN:
 * 1. WARP preload: SSR hydration via initialData
 * 2. Real-time sync: useAdminSync() keeps FUSE fresh
 * 3. Components read: useAdminData() → FUSE only
 * 4. Image preload: Avatars + logos cached for instant drawer display
 */
export function AdminProvider({ children, initialData }: AdminProviderProps) {
  const hydrateAdmin = useFuse((state) => state.hydrateAdmin);

  // Real-time sync: Convex → FUSE (TTTS-2 compliant)
  useAdminSync();

  useEffect(() => {
    // SSR hydration (WARP preload)
    if (initialData && (initialData.users?.length || initialData.deletionLogs?.length)) {
      console.log('🛡️ AdminProvider: Hydrating admin domain from WARP');
      hydrateAdmin(initialData, 'WARP');

      // Preload user images after hydration
      if (initialData.users?.length) {
        preloadUserImages(initialData.users);
      }
    }
  }, [hydrateAdmin, initialData]);

  return <>{children}</>;
}
