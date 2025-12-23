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
import { Backdrop } from '@/vr';

export default function ShadowKing() {
  const shadowKingActive = useFuse((s) => s.shadowKingActive);
  const setShadowKingActive = useFuse((s) => s.setShadowKingActive);
  const setShowRedArrow = useFuse((s) => s.setShowRedArrow);
  const user = useFuse((s) => s.user);

  // Only show if Shadow King is active AND setup is actually pending
  const shouldShow = shadowKingActive && user?.setupStatus === 'pending';

  // Lock body scroll AND hide scrollbar when Shadow King is active
  useEffect(() => {
    if (shouldShow) {
      // Hide scrollbar on both html and body to prevent double scrollbar
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      };
    }
  }, [shouldShow]);

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

  const handleClose = () => {
    setShadowKingActive(false);
    setShowRedArrow(false);
  };

  return (
    <>
      <Backdrop />
      {/* Dedicated close layer - covers entire viewport, BEHIND modal */}
      <div
        className="ft-shadow-king-close-layer"
        onClick={handleClose}
        aria-label="Close modal"
      />
      {/* Modal container - scrollable, ABOVE close layer */}
      <div className="ft-shadow-king">
        <SetupModal />
      </div>
    </>
  );
}
