/**──────────────────────────────────────────────────────────────────────┐
│  📍 TOPBAR - Full-Width Frame with Logo (WCCC ly-* Compliant)         │
│  /src/shell/Topbar/Topbar.tsx                                         │
│                                                                        │
│  VR-Sovereign: Pure layout shell with declarative imports.            │
│  Uses Sovereign Router for navigation (FUSE 6.0).                     │
│  Uses: --topbar-height, --topbar-bg, --topbar-logo-width              │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import Image from 'next/image';
import { useFuse } from '@/store/fuse';
import { useRankCheck } from '@/fuse/hydration/hooks/useRankCheck';
import TopbarSetupButton from '@/features/setup/topbar-button';

export default function Topbar() {
  const { isAdmiral } = useRankCheck();
  const themeMode = useFuse((s) => s.themeMode);

  // Determine logo based on rank
  const getLogoSrc = () => {
    if (isAdmiral()) {
      return themeMode === 'dark'
        ? '/images/sitewide/admiral-logo-dk.png'
        : '/images/sitewide/admiral-logo.png';
    }
    return themeMode === 'dark'
      ? '/images/brand/transfoorm-dk.png'
      : '/images/brand/transfoorm.png';
  };

  return (
    <header className="ly-topbar-header">
      <div className="ly-topbar-left-container">
      </div>

      <div className="ly-topbar-right-container">
        {/* Setup button - VR owns all behavior */}
        <TopbarSetupButton />

        <div className="ly-topbar-logo-wrapper">
          <Image
            src={getLogoSrc()}
            alt={isAdmiral() ? "Transfoorm Fleet Control Manager" : "Transfoorm"}
            width={2000}
            height={400}
            className="ly-topbar-logo-image"
            priority
          />
        </div>
      </div>
    </header>
  );
}
