/**
 * ══════════════════════════════════════════════════════════════════════════════
 * DOMAIN SLICE TEMPLATE - THE STANDARD
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Every domain slice MUST follow this exact structure.
 * This is not a suggestion. This is TTT Law.
 *
 * ADP Coordination Fields (REQUIRED per TTTS-1):
 *   - status: 'idle' | 'loading' | 'hydrated' | 'error'
 *   - lastFetchedAt: number | undefined
 *   - source: 'SSR' | 'WARP' | 'COOKIE' | 'CONVEX_LIVE' | 'MUTATION' | 'ROLLBACK' | undefined
 *
 * Required Functions:
 *   - hydrate[Domain]: (data, source?) => void
 *   - clear[Domain]: () => void
 *
 * Hydration Check (THE STANDARD per TTTS-1):
 *   - status === 'hydrated' means data is ready
 *   - NO separate isXHydrated booleans
 *   - ONE source of truth
 *
 * This enables:
 *   - WARP freshness checks (prevents duplicate fetches)
 *   - TTL revalidation (5 min freshness window)
 *   - Debugging (know where data came from)
 *   - PRISM coordination (status prevents race conditions)
 *
 * References:
 *   - 04-ADP-PATTERN.md
 *   - 15-TTT-SUPPLEMENT.md
 *   - TTTS-ENFORCEMENT-PACK-(v1.0).md
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** ADP Source tracking - where did the data come from? */
export type ADPSource = 'SSR' | 'WARP' | 'COOKIE' | 'CONVEX_LIVE' | 'MUTATION' | 'ROLLBACK';

/** ADP Status - domain hydration state (TTTS-1 compliant) */
export type ADPStatus = 'idle' | 'loading' | 'hydrated' | 'error';

/** Base ADP coordination fields - EVERY slice must have these */
export interface ADPCoordination {
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

// ─────────────────────────────────────────────────────────────────────────────
// Performance Timer - Shared across all domain slices
// ─────────────────────────────────────────────────────────────────────────────

/** FUSE Performance Monitor - Track every millisecond */
export const fuseTimer = {
  start: (action: string): number => {
    const startTime = performance.now();
    if (process.env.NODE_ENV === 'development') {
      console.log(`FUSE START: ${action}`);
    }
    return startTime;
  },

  end: (action: string, startTime: number): number => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (process.env.NODE_ENV === 'development') {
      const level = duration < 1 ? 'FAST' : duration < 10 ? 'GOOD' : duration < 50 ? 'SLOW' : 'VERY_SLOW';
      console.log(`FUSE END [${level}]: ${action} -> ${duration.toFixed(2)}ms`);
    }
    return duration;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Template (Copy this for new domains)
// ─────────────────────────────────────────────────────────────────────────────

/*
export interface [Domain]Data {
  // Domain-specific data fields
}

export interface [Domain]Slice extends ADPCoordination {
  // Domain data
  data: [Domain]Data;
}

export interface [Domain]Actions {
  hydrate[Domain]: (data: Partial<[Domain]Data>, source?: ADPSource) => void;
  clear[Domain]: () => void;
}

const initial[Domain]State: [Domain]Slice = {
  data: { ... },
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

export const create[Domain]Slice: StateCreator<
  [Domain]Slice & [Domain]Actions,
  [],
  [],
  [Domain]Slice & [Domain]Actions
> = (set) => ({
  ...initial[Domain]State,

  hydrate[Domain]: (data, source = 'WARP') =>
    set((state) => ({
      data: { ...state.data, ...data },
      status: 'hydrated',  // TTTS-1 compliant
      lastFetchedAt: Date.now(),
      source,
    })),

  clear[Domain]: () =>
    set(initial[Domain]State),
});
*/
