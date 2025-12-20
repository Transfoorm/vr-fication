/**──────────────────────────────────────────────────────────────────────┐
│  🔱 DASHBOARD - Sovereign Domain                                        │
│  /src/app/domains/Dashboard.tsx                                         │
│                                                                        │
│  VR-Sovereign: Pure declarative shell with ZERO ceremony logic.        │
│  SetupModal owns ALL behavior: visibility, animation, server actions.  │
│  FUSE 6.0: Pure client view that reads from FUSE store.                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import SetupModal from '@/features/setup/setup-modal';
import FlyingButton from '@/features/setup/flying-button';

export default function Dashboard() {
  useSetPageHeader(undefined, 'Coming soon');

  return (
    <>
      {/* SetupModal - VR-Sovereign: owns ALL behavior */}
      <SetupModal />

      {/* FlyingButton - VR owns Phoenix animation */}
      <FlyingButton />
    </>
  );
}
