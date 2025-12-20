# 🔱 1. SRB IMPLEMENTATION KIT

(Step-by-step, safe, surgical, incremental)

This is the exact sequence you and your devs follow.
Executed in this order, the system remains stable at all times.

⸻

PHASE A — Establish Sovereign Ground (Day 1–2)

A1. Create the FuseApp root (client)

/app/app/FuseApp.tsx

'use client';

import RouterView from './router/RouterView';

export default function FuseApp() {
  return (
    <div className="fuse-app">
      <RouterView />
    </div>
  );
}

A2. Modify /app/app/page.tsx to mount FuseApp

// app/app/page.tsx (server component)
import FuseApp from './FuseApp';

export default function Page() {
  return <FuseApp />;
}

This creates the handover point:
App Router loads once → FUSE takes over forever.

A3. Create the Sovereign Router folder

/app/app/router/
   RouterView.tsx
   navigate.ts
   state.ts

A4. Implement route state atom

state.ts

import { atom } from 'jotai';

export const routeAtom = atom<'dashboard' | 'crew' | 'ledger' | 'settings'>('dashboard');

A5. Implement navigate()

navigate.ts

import { routeAtom } from './state';
import { getDefaultStore } from 'jotai';

export function navigate(route) {
  getDefaultStore().set(routeAtom, route);
}

A6. Implement RouterView (switch)

RouterView.tsx

'use client';

import { useAtomValue } from 'jotai';
import { routeAtom } from './state';
import Dashboard from '../views/Dashboard';
import Crew from '../views/Crew';
import Ledger from '../views/Ledger';

export default function RouterView() {
  const route = useAtomValue(routeAtom);

  switch (route) {
    case 'dashboard': return <Dashboard />;
    case 'crew': return <Crew />;
    case 'ledger': return <Ledger />;
    default: return <Dashboard />;
  }
}


⸻

PHASE B — FUSE-FIRST DOMAIN (Day 3–4)

B1. Move domain pages to /app/app/views

/views/Dashboard.tsx
/views/Crew.tsx
/views/Ledger.tsx

B2. Make each page PURE CLIENT & PURE FUSE

Example dashboard:

'use client';
import { useUser } from '@/fuse/user';

export default function Dashboard() {
  const user = useUser();
  if (!user) return <WarpPlaceholder />;

  return <DashboardUI user={user} />;
}

No fetching.
No waiting.
No RSC.
FUSE or WARP fills the data.

B3. Update navigation UI

Replace:

router.push('/app/dashboard');

With:

navigate('dashboard');

Instant.
Zero network.

⸻

PHASE C — WARP ORCHESTRATOR (Day 4–5)

C1. Add orchestrator

/fuse/warp-orchestrator.ts

import { warp } from './warp';

export function runWarpPreload() {
  requestIdleCallback(() => {
    warp.preload('user');
    warp.preload('team');
    warp.preload('ledger');
    warp.preload('notifications');
  });
}

C2. Trigger on login

Inside FuseApp:

useEffect(() => {
  runWarpPreload();
}, []);

This is the FUSE resurrection moment.

⸻

PHASE D — CONVEX REBALANCING (Day 5–7)

D1. Convert Convex to background sync

Convex no longer drives UI.
FUSE does.

D2. Modify all queries to hydrate FUSE directly

Example:

const data = await convex.query('getTeam');
fuse.team.set(data);

Pages now simply do:

const team = useTeam();

D3. Never read Convex inside pages.

This is non-negotiable doctrine.

⸻

🌐 2. FUSE SOVEREIGN DIAGRAM

(The architecture as a living organism)

                    ┌──────────────────────────────┐
                    │       App Router (Next.js)    │
                    │  - Login, Register, Public    │
                    │  - Server-rendered Shell      │
                    └────────────┬──────────────────┘
                                 │ Handover (/app)
                                 ▼
                    ┌──────────────────────────────┐
                    │           FuseApp (Client)    │
                    │  - Mounts once                │
                    │  - Never unmounts             │
                    │  - Sovereign runtime          │
                    └────────────┬──────────────────┘
                                 │
                                 ▼
               ┌──────────────────────────────────────────┐
               │         Sovereign Router (SR)            │
               │  - routeAtom (state)                     │
               │  - navigate()                            │
               │  - RouterView()                          │
               └──────────────┬───────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────────┐
               │             Domain Views                  │
               │  (Dashboard, Crew, Ledger, Tasks, etc.)  │
               │   - Pure client                          │
               │   - 32–65ms navigation                   │
               │   - Renders from FUSE store              │
               └──────────────┬──────────────────────────┘
                              │
                              ▼
     ┌──────────────────────────────────────────────────────────────────┐
     │                            FUSE STORE                           │
     │   - Canonical application state                                  │
     │   - Hydrated by WARP and Convex background sync                 │
     └──────────────────────────┬────────────────────────────────────────┘
                                │
                                ▼
               ┌──────────────────────────────────────────┐
               │           WARP ORCHESTRATOR               │
               │   - Preloads all domain data             │
               │   - requestIdleCallback()                │
               │   - Zero latency across navigation       │
               └──────────────┬──────────────────────────┘
                              │
                              ▼
               ┌──────────────────────────────────────────┐
               │          Convex Background Sync           │
               │   - Not UI-critical                       │
               │   - Not blocking                          │
               │   - Hydrates FUSE                         │
               └──────────────────────────────────────────┘

This diagram is the mind map for the next 10 years of Transfoorm.
