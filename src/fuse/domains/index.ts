/**──────────────────────────────────────────────────────────────────────┐
│  🚀 FUSE STACK - Domain Registry Exports                               │
│  /src/fuse/domains/index.ts                                            │
│                                                                        │
│  Central export point for FUSE domain utilities and registry           │
└────────────────────────────────────────────────────────────────────────┘ */

// Domain registry exports
export {
  DOMAINS,
  getDomain,
  getAllDomainKeys,
  getAllDomains,
  getDomainForRoute,
  getDomainHook,
  getDomainProvider,
  getDomainStoreSlice,
  getDomainsForRank,
  getDomainsByCategory,
  rankHasAccess,
  type DomainKey,
  type DomainConfig,
} from './registry';
