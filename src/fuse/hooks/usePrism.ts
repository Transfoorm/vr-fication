/**──────────────────────────────────────────────────────────────────────┐
│  🔮 PRISM - Predictive Reactions and Intelligent Store Management    │
│  /src/fuse/hooks/usePrism.ts                                          │
│                                                                        │
│  Frontend intent detection that triggers WARP preloading.             │
│  Strategy 1: Load entire domain on dropdown open.                     │
│                                                                        │
│  Usage in Sidebar:                                                    │
│  const prism = usePrism();                                            │
│  onClick={() => { toggleSection('productivity'); prism.preloadDomain('productivity'); }}
│                                                                        │
│  ADP Compliant: Coordinates with WARP routes and FUSE store.          │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useFuse } from '@/store/fuse';
import type { ADPSource } from '@/store/domains/_template';
import { AVATAR_OPTIONS } from '@/fuse/constants/coreThemeConfig';

// Domain to WARP route mapping - ALL domains now have WARP routes
const DOMAIN_ROUTES: Record<string, string> = {
  productivity: '/api/warp/productivity',
  admin: '/api/warp/admin',
  clients: '/api/warp/clients',
  finance: '/api/warp/finance',
  projects: '/api/warp/projects',
  system: '/api/warp/system',
  settings: '/api/warp/settings',
};

// Domain to images mapping - preload critical images when domain is accessed
// Avatar images derived from AVATAR_OPTIONS constant (single source of truth)
const DOMAIN_IMAGES: Record<string, string[]> = {
  settings: [
    // MirorAI avatars - derived from constant, no manual sync needed
    ...AVATAR_OPTIONS.map(opt => `/images/ai/miror-${opt}.png`),
    // Twinkle effect
    '/images/sitewide/twinkle.webp',
  ],
};

// Preload images into browser cache
function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

// Domain to FUSE hydration function mapping
type DomainKey = 'productivity' | 'admin' | 'clients' | 'finance' | 'projects' | 'system' | 'settings';

export function usePrism() {
  // Track in-flight requests to prevent duplicate calls
  const inFlightRef = useRef<Set<string>>(new Set());

  // Get hydration functions from FUSE store
  const hydrateProductivity = useFuse((s) => s.hydrateProductivity);
  const hydrateAdmin = useFuse((s) => s.hydrateAdmin);
  const hydrateClients = useFuse((s) => s.hydrateClients);
  const hydrateFinance = useFuse((s) => s.hydrateFinance);
  const hydrateProjects = useFuse((s) => s.hydrateProjects);
  const hydrateSystem = useFuse((s) => s.hydrateSystem);
  const hydrateSettings = useFuse((s) => s.hydrateSettings);
  const hydrateGenome = useFuse((s) => s.hydrateGenome);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const productivityStatus = useFuse((s) => s.productivity.status);
  const adminStatus = useFuse((s) => s.admin.status);
  const clientsStatus = useFuse((s) => s.clients.status);
  const financeStatus = useFuse((s) => s.finance.status);
  const projectsStatus = useFuse((s) => s.projects.status);
  const systemStatus = useFuse((s) => s.system.status);
  const settingsStatus = useFuse((s) => s.settings.status);

  // Map domain to status for hydration check
  const domainStatusMap = useMemo<Record<DomainKey, string>>(() => ({
    productivity: productivityStatus,
    admin: adminStatus,
    clients: clientsStatus,
    finance: financeStatus,
    projects: projectsStatus,
    system: systemStatus,
    settings: settingsStatus,
  }), [productivityStatus, adminStatus, clientsStatus, financeStatus, projectsStatus, systemStatus, settingsStatus]);

  // Map domain to hydration function
  // Each domain accepts its own data shape - cast to unknown for pass-through
  const hydrateMap = useMemo(() => ({
    productivity: hydrateProductivity as (data: unknown, source?: ADPSource) => void,
    admin: hydrateAdmin as (data: unknown, source?: ADPSource) => void,
    clients: hydrateClients as (data: unknown, source?: ADPSource) => void,
    finance: hydrateFinance as (data: unknown, source?: ADPSource) => void,
    projects: hydrateProjects as (data: unknown, source?: ADPSource) => void,
    system: hydrateSystem as (data: unknown, source?: ADPSource) => void,
    settings: hydrateSettings as (data: unknown, source?: ADPSource) => void,
  }), [hydrateProductivity, hydrateAdmin, hydrateClients, hydrateFinance, hydrateProjects, hydrateSystem, hydrateSettings]);

  const preloadDomain = useCallback(async (domain: DomainKey) => {
    // Always preload images for domain (they may not be cached yet)
    const domainImages = DOMAIN_IMAGES[domain];
    if (domainImages) {
      preloadImages(domainImages);
    }

    // Skip data fetch if already hydrated (TTTS-1: status === 'hydrated')
    if (domainStatusMap[domain] === 'hydrated') {
      console.log(`🔮 PRISM: ${domain} already hydrated, skipping data fetch`);
      return;
    }

    // Skip if request already in flight
    if (inFlightRef.current.has(domain)) {
      console.log(`🔮 PRISM: ${domain} request already in flight`);
      return;
    }

    const route = DOMAIN_ROUTES[domain];
    if (!route) {
      console.warn(`🔮 PRISM: No WARP route for domain "${domain}"`);
      return;
    }

    // Mark as in-flight
    inFlightRef.current.add(domain);
    console.log(`🔮 PRISM: Preloading ${domain} domain...`);

    try {
      const start = performance.now();
      // eslint-disable-next-line no-restricted-globals
      const response = await fetch(route);

      if (!response.ok) {
        throw new Error(`WARP failed: ${response.status}`);
      }

      const data = await response.json();
      const duration = performance.now() - start;

      // Hydrate the appropriate slice
      const hydrateFn = hydrateMap[domain];
      if (hydrateFn) {
        hydrateFn(data, 'WARP');
      }

      // Settings domain also includes genome - hydrate it separately
      if (domain === 'settings' && data.genome) {
        hydrateGenome(data.genome);
      }

      console.log(`🔮 PRISM: ${domain} loaded in ${duration.toFixed(2)}ms`, data);
    } catch (error) {
      console.error(`🔮 PRISM: Failed to preload ${domain}:`, error);
    } finally {
      // Remove from in-flight
      inFlightRef.current.delete(domain);
    }
  }, [
    domainStatusMap,
    hydrateMap,
    hydrateGenome
  ]);

  return { preloadDomain };
}
