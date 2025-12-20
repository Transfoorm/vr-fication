/**──────────────────────────────────────────────────────────────────────┐
│  🔱 SOVEREIGN HANDOVER - App Router → FUSE 6.0                        │
│  /src/app/page.tsx                                                    │
│                                                                        │
│  This is THE handover point at ROOT.                                  │
│  App Router loads this page ONCE.                                     │
│  Then FUSE takes command. Forever.                                    │
│                                                                        │
│  From this line onward:                                               │
│  • No middleware on nav                                               │
│  • No layouts reinstantiating                                         │
│  • No RSC fetch                                                       │
│  • No router.push cost                                                │
│                                                                        │
│  The Sovereign Router takes over.                                     │
│  32-65ms navigation. Zero server. Pure doctrine.                      │
└────────────────────────────────────────────────────────────────────────┘ */

import FuseApp from './FuseApp';

export default function SovereignHandoverPage() {
  // App Router stops here
  // FUSE takes command
  return <FuseApp />;
}
