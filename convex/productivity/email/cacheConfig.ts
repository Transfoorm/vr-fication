/**──────────────────────────────────────────────────────────────────────────────┐
│  📦 EMAIL BODY CACHE CONFIGURATION                                            │
│  /convex/productivity/email/cacheConfig.ts                                    │
│                                                                                │
│  GRADUATED ENABLEMENT: Build once, tune via config                            │
│  Change requires deploy but NOT schema migration                              │
│                                                                                │
│  See: /docs/EMAIL-BODY-CACHE-IMPLEMENTATION.md                                │
│  See: /docs/STORAGE-LIFECYCLE-DOCTRINE.md                                     │
└──────────────────────────────────────────────────────────────────────────────*/

/**
 * EMAIL BODY CACHE CONFIGURATION
 *
 * These values control cache behavior.
 * The "dial" for graduated enablement.
 */
export const CACHE_CONFIG = {
  /**
   * Maximum bodies to cache per email account.
   *
   * GRADUATED ENABLEMENT:
   * - 0   = Pure on-demand (Layer 0 only)
   * - 20  = Friction smoother - CURRENT SETTING
   * - 50  = Working set coverage
   * - 100 = Full Layer 1
   *
   * Dial up based on user feedback.
   * Prefetch still works at 0 (populates memory, not storage).
   */
  maxBodiesPerAccount: 0, // DISABLED: Prefetch architecture needs redesign (fetch on click → prefetch during sync)

  /**
   * Maximum age before body is evicted (days).
   * Prevents light users from accumulating stale cache indefinitely.
   */
  ttlDays: 14,

  /**
   * Whether prefetch is enabled.
   * Should always be true — prefetch works even at cache size 0.
   * At cache size 0, prefetch warms in-memory state only.
   */
  prefetchEnabled: true,

  /**
   * Maximum concurrent prefetch requests.
   * Prevents flooding Microsoft Graph during rapid scrolling.
   */
  maxConcurrentPrefetch: 5,

  /**
   * Hover delay before prefetch triggers (milliseconds).
   * Prevents prefetch spam during quick mouse movements.
   */
  hoverDelayMs: 300,
};

/**
 * Type for cache configuration
 */
export type CacheConfig = typeof CACHE_CONFIG;
