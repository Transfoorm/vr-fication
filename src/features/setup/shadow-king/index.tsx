'use client';

/**──────────────────────────────────────────────────────────────────────────┐
 │  👑 SHADOW KING - Sovereign Setup Enforcement                            │
 │  /src/features/setup/shadow-king/index.tsx                                │
 │                                                                          │
 │  The Shadow King is a sovereign global modal, permanently mounted at     │
 │  the FuseApp shell level. It only activates when user intentionally      │
 │  enters identity territory (Account, Profile links).                     │
 │                                                                          │
 │  Rules:                                                                  │
 │  - Dormant by default (shadowKingActive = false)                         │
 │  - Awakens when user clicks identity-related actions                     │
 │  - Blocks entire app with backdrop until setup completes                 │
 │  - No "Skip for now" - user must complete to proceed                     │
 └────────────────────────────────────────────────────────────────────────────*/

import { useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import SetupModal from '@/features/setup/setup-modal';
import { Backdrop } from '@/prebuilts';

export default function ShadowKing() {
  const shadowKingActive = useFuse((s) => s.shadowKingActive);
  const setShadowKingActive = useFuse((s) => s.setShadowKingActive);
  const setShowRedArrow = useFuse((s) => s.setShowRedArrow);
  const user = useFuse((s) => s.user);

  // Only show if Shadow King is active AND setup is actually pending
  const shouldShow = shadowKingActive && user?.setupStatus === 'pending';

  // Show red arrow when Shadow King activates
  useEffect(() => {
    if (shouldShow) {
      // Small delay so arrow appears after modal animation
      const timer = setTimeout(() => {
        setShowRedArrow(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, setShowRedArrow]);

  if (!shouldShow) return null;

  const handleBackdropClick = () => {
    // Outside click = just close, NOT skip
    setShadowKingActive(false);
    setShowRedArrow(false);  // Hide arrow when closing
    // Note: Do NOT set modalSkipped - user didn't explicitly skip
  };

  return (
    <>
      <Backdrop onClick={handleBackdropClick} />
      <div className="ft-shadow-king">
        {/* SetupModal is VR-Sovereign: owns all behavior including server actions */}
        <SetupModal />
      </div>
    </>
  );
}
