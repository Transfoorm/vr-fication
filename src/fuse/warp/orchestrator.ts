/**──────────────────────────────────────────────────────────────────────┐
│  🚀 TRUE WARP - Background Preload Orchestrator                       │
│  /src/fuse/warp/orchestrator.ts                                       │
│                                                                        │
│  FUSE 6.0: Preload domains based on rank's sidebar navigation         │
│  - Derives domains from nav configs (single source of truth)          │
│  - TTL revalidation (5 min) on focus/online events                    │
│  - Non-blocking: runs during browser idle time                        │
│  - Sequential to avoid network congestion                             │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useFuse } from '@/store/fuse';
import { admiralNav } from '@/shell/sidebar/navigation/admiral';
import { commodoreNav } from '@/shell/sidebar/navigation/commodore';
import { captainNav } from '@/shell/sidebar/navigation/captain';
import { crewNav } from '@/shell/sidebar/navigation/crew';
import type { NavSection } from '@/shell/sidebar/navigation/types';

// ═══════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════

export type Rank = 'admiral' | 'commodore' | 'captain' | 'crew';

type ADPSource = 'SSR' | 'WARP' | 'MUTATION';

// ═══════════════════════════════════════════════════════════════════════
// NAV CONFIG BY RANK
// ═══════════════════════════════════════════════════════════════════════

const navByRank: Record<Rank, NavSection[]> = {
  admiral: admiralNav,
  commodore: commodoreNav,
  captain: captainNav,
  crew: crewNav,
};

// ═══════════════════════════════════════════════════════════════════════
// TTL TRACKING
// ═══════════════════════════════════════════════════════════════════════

const FIVE_MIN = 5 * 60 * 1000;

// Per-domain TTL tracking (dynamically populated)
const lastFetchAt: Record<string, number> = {};

// ═══════════════════════════════════════════════════════════════════════
// EXTRACT DOMAINS FROM NAV CONFIG
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extract unique domain names from a rank's navigation config
 * Domains are the top-level nav items (excluding Dashboard)
 */
function getDomainsForRank(rank: Rank): string[] {
  const nav = navByRank[rank];
  if (!nav) return [];

  return nav
    .filter((section) => section.label.toLowerCase() !== 'dashboard')
    .map((section) => section.label.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════════
// CORE WARP FUNCTION - Preload domains from rank's sidebar
// ═══════════════════════════════════════════════════════════════════════

/**
 * Run WARP preload for rank's sidebar domains
 * Called once on FuseApp mount via requestIdleCallback
 * Non-blocking, sequential to avoid network congestion
 */
export async function runWarpPreload() {
  const state = useFuse.getState();
  const rank = state.rank?.toLowerCase() as Rank | undefined;

  if (!rank) {
    console.log('🔱 WARP-O: No rank detected, skipping preload');
    return;
  }

  // Get domains from this rank's sidebar nav
  const domains = getDomainsForRank(rank);

  console.log(`🔱 WARP-O: Starting preload for rank="${rank}" domains=[${domains.join(', ')}]`);
  const startTime = performance.now();

  try {
    for (const domain of domains) {
      // Get hydrate function by domain name
      const hydrateKey = `hydrate${domain.charAt(0).toUpperCase() + domain.slice(1)}` as keyof typeof state;
      const hydrateFn = state[hydrateKey] as HydrateFn | undefined;

      if (hydrateFn) {
        await preloadDomain(domain, hydrateFn);
      } else {
        console.warn(`⚠️ WARP-O: No hydrate function for domain "${domain}"`);
      }
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`✅ WARP-O: Preload complete in ${duration}ms`);
  } catch (error) {
    console.error('❌ WARP-O: Preload failed:', error);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// DOMAIN PRELOAD HELPER
// ═══════════════════════════════════════════════════════════════════════

type HydrateFn = (data: Record<string, unknown>, source?: ADPSource) => void;

async function preloadDomain(
  domain: string,
  hydrateFn: HydrateFn
): Promise<void> {
  // Check freshness via module-level TTL tracking
  const lastFetch = lastFetchAt[domain] || 0;
  if (Date.now() - lastFetch < FIVE_MIN) {
    console.log(`🔄 WARP-O: Skipping ${domain} (fresh, ${Math.round((Date.now() - lastFetch) / 1000)}s old)`);
    return;
  }

  try {
    console.log(`🚀 WARP-O: Preloading ${domain}...`);
    const start = performance.now();

    // eslint-disable-next-line no-restricted-globals
    const res = await fetch(`/api/warp/${domain}`, {
      credentials: 'same-origin',
    });

    if (!res.ok) {
      console.warn(`⚠️ WARP-O: ${domain} API returned ${res.status}`);
      return;
    }

    const bundle = await res.json();
    hydrateFn(bundle, 'WARP');
    lastFetchAt[domain] = Date.now();

    const duration = Math.round(performance.now() - start);
    console.log(`✅ WARP-O: ${domain} preloaded in ${duration}ms`);
  } catch (error) {
    console.warn(`⚠️ WARP-O: ${domain} preload failed:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TTL REVALIDATION
// ═══════════════════════════════════════════════════════════════════════

/**
 * Attach TTL revalidation listeners
 * Refreshes stale domains on window focus/online
 * Returns cleanup function
 */
export function attachTTLRevalidation(): () => void {
  async function maybeRevalidate() {
    const state = useFuse.getState();
    const rank = state.rank?.toLowerCase() as Rank | undefined;

    if (!rank) return;

    // Get domains from this rank's sidebar nav
    const domains = getDomainsForRank(rank);

    console.log('🔄 WARP-O: Checking TTL on focus/online...');

    for (const domain of domains) {
      const lastFetch = lastFetchAt[domain] || 0;
      if (Date.now() - lastFetch > FIVE_MIN) {
        // Get hydrate function by domain name
        const hydrateKey = `hydrate${domain.charAt(0).toUpperCase() + domain.slice(1)}` as keyof typeof state;
        const hydrateFn = state[hydrateKey] as HydrateFn | undefined;
        if (hydrateFn) {
          await preloadDomain(domain, hydrateFn);
        }
      }
    }
  }

  window.addEventListener('focus', maybeRevalidate);
  window.addEventListener('online', maybeRevalidate);

  return () => {
    window.removeEventListener('focus', maybeRevalidate);
    window.removeEventListener('online', maybeRevalidate);
  };
}

// ═══════════════════════════════════════════════════════════════════════
// RESET TTL (for sign-out)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Reset all WARP TTLs on sign-out
 * Ensures fresh fetch on next login
 */
export function resetWarpTTL(): void {
  Object.keys(lastFetchAt).forEach((key) => {
    lastFetchAt[key] = 0;
  });
  console.log('🔱 WARP-O: TTL reset');
}
