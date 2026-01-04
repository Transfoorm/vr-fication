/**──────────────────────────────────────────────────────────────────────┐
│  ⚡ WORK PROVIDER - Domain Provider Pattern                            │
│  /src/providers/ProductivityProvider.tsx                                       │
│                                                                        │
│  Part of the Great Provider Ecosystem                                  │
│  Hydrates work domain slice with WARP-preloaded data                   │
│  Following proven _T2 pattern                                          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { ReactNode, useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import type { ProductivitySlice } from '@/store/types';
import { useProductivitySync } from '@/hooks/useProductivitySync';
import { EmailConnectedModal } from '@/features/productivity/email-console/EmailConnectedModal';

interface ProductivityProviderProps {
  children: ReactNode;
  initialData?: Partial<ProductivitySlice>;
}

/**
 * ProductivityProvider - Hydrates work domain with WARP-preloaded data
 *
 * Architecture:
 * - Receives initialData from section layout's WARP preload function
 * - Hydrates FUSE store work slice on mount
 * - Zero UI - pure state hydration (except celebration modal)
 * - Children render with instant data access
 */
export function ProductivityProvider({ children, initialData }: ProductivityProviderProps) {
  const hydrateProductivity = useFuse((state) => state.hydrateProductivity);

  // 🌉 GOLDEN BRIDGE: Real-time Convex → FUSE sync
  // Also returns email connected modal state
  const { showConnectedModal, dismissConnectedModal, connectedEmail } = useProductivitySync();

  useEffect(() => {
    if (initialData) {
      // 🔥 FUSE 6.0 + WARP: Hydrate productivity domain with server data
      console.log('⚡ ProductivityProvider: Hydrating productivity domain (WARP)', initialData);
      hydrateProductivity(initialData);
    } else {
      console.log('⚠️ ProductivityProvider: No initialData received from WARP');
    }
  }, [hydrateProductivity, initialData]); // Only run on mount - initialData comes from server preload

  return (
    <>
      {children}
      {/* 🎉 Email Connected Celebration Modal */}
      {showConnectedModal && connectedEmail && (
        <EmailConnectedModal
          emailAddress={connectedEmail}
          onDismiss={dismissConnectedModal}
        />
      )}
    </>
  );
}
