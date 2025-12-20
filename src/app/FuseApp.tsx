/**──────────────────────────────────────────────────────────────────────┐
│  🔱 FUSE APP - The Sovereign Runtime                                   │
│  /src/app/FuseApp.tsx                                                  │
│                                                                        │
│  FUSE 6.0: This component NEVER unmounts after initial load.           │
│  It is the persistent client shell that owns all domain navigation.    │
│                                                                        │
│  Architecture:                                                         │
│  • Mounts once from /app/page.tsx (server handover at ROOT)            │
│  • Contains the full app shell (Sidebar, Topbar, AISidebar)            │
│  • Router switches domain views based on FUSE sovereign.route          │
│  • WARP Orchestrator preloads all domain data on mount                 │
│  • Zero server round-trips after initial load                          │
│                                                                        │
│  This is where FUSE Doctrine becomes reality.                          │
│  01-65ms navigation. Every click. Forever.                             │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useEffect } from 'react';
import { useFuse } from '@/store/fuse';
import { urlPathToRoute } from '@/store/domains/navigation';

// Shell components
import { ClientHydrator } from '@/fuse/hydration/ClientHydrator';
import { UserSyncProvider } from '@/providers/UserSyncProvider';
import Topbar from '@/shell/topbar/Topbar';
import Sidebar from '@/shell/sidebar/Sidebar';
import AISidebar from '@/shell/ai-sidebar/AISidebar';
import PageArch from '@/shell/page-arch/PageArch';
import PageHeader from '@/shell/page-header/PageHeader';
import Footer from '@/shell/footer/Footer';

// Sovereign Router - dynamically imported to prevent SSR (FOUC prevention)
import dynamic from 'next/dynamic';
const Router = dynamic(() => import('./domains/Router'), { ssr: false });

// Shadow King - Sovereign Setup Enforcement (shell-level)
import ShadowKing from '@/features/setup/shadow-king';

// WARP Orchestrator
import { runWarpPreload, attachTTLRevalidation } from '@/fuse/warp/orchestrator';

// Domain providers (will be removed in Phase F - currently needed for data)
import { FinanceProvider } from '@/providers/FinanceProvider';
import { ClientsProvider } from '@/providers/ClientsProvider';
import { ProductivityProvider } from '@/providers/ProductivityProvider';
import { ProjectsProvider } from '@/providers/ProjectsProvider';

// Layout CSS
import '@/shell/app.css';

// ═══════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════

/** Enable curved frame (PageArch) around content */
const USE_CURVES = true;

// ═══════════════════════════════════════════════════════════════════════
// FUSE APP - THE SOVEREIGN RUNTIME
// ═══════════════════════════════════════════════════════════════════════

export default function FuseApp() {
  // Sovereign Router state and actions
  const sovereignHydrateSections = useFuse((s) => s.sovereignHydrateSections);
  const navigate = useFuse((s) => s.navigate);
  const user = useFuse((s) => s.user);

  // ─────────────────────────────────────────────────────────────────────
  // INITIAL MOUNT - Happens ONCE, then FUSE takes over
  // ─────────────────────────────────────────────────────────────────────
  // Note: FOUC prevention now happens at store initialization time.
  // The store reads the URL and sets the correct route BEFORE React renders.
  useEffect(() => {
    console.log('🔱 FUSE 6.0: Sovereign runtime mounted');

    // 1. Hydrate sidebar sections from localStorage
    sovereignHydrateSections();

    // 2. Handle browser back/forward buttons
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.route) {
        navigate(event.state.route);
      } else {
        // Parse from URL if no state
        const route = urlPathToRoute(window.location.pathname);
        navigate(route);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // 3. WARP Orchestrator - Preload all domain data during idle time
    // This is the FUSE resurrection moment
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        runWarpPreload();
      }, { timeout: 2000 });
    } else {
      // Fallback for Safari
      setTimeout(runWarpPreload, 100);
    }

    // 4. TTL Revalidation - Refresh stale data on focus/online
    const cleanupTTL = attachTTLRevalidation();

    return () => {
      window.removeEventListener('popstate', handlePopState);
      cleanupTTL();
    };
  }, [sovereignHydrateSections, navigate]);

  // ─────────────────────────────────────────────────────────────────────
  // RENDER - The Sovereign Shell
  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* FUSE: Hydrate client store from session cookie */}
      <ClientHydrator />
      <UserSyncProvider />

      {/* Domain Providers - TODO: Remove in Phase F when views read from FUSE only */}
      <FinanceProvider>
        <ClientsProvider>
          <ProductivityProvider>
            <ProjectsProvider>
              <div data-user-rank={user?.rank || undefined} className="ly-app-container">
                <Sidebar />
                <div className="ly-app-right-container">
                  <Topbar />
                  <div className="ly-app-main-container">
                    <main className={USE_CURVES ? 'ly-app-content-with-arch' : 'ly-app-content-without-arch'}>
                      {USE_CURVES ? (
                        <PageArch>
                          <PageHeader />
                          {/* 🔱 SOVEREIGN ROUTER - Views switch here */}
                          <Router />
                        </PageArch>
                      ) : (
                        <>
                          <PageHeader />
                          {/* 🔱 SOVEREIGN ROUTER - Views switch here */}
                          <Router />
                        </>
                      )}
                    </main>
                    <AISidebar />
                  </div>
                  <Footer />
                </div>
              </div>
            </ProjectsProvider>
          </ProductivityProvider>
        </ClientsProvider>
      </FinanceProvider>

      {/* 👑 SHADOW KING - Sovereign Setup Enforcement (above everything) */}
      <ShadowKing />
    </>
  );
}
