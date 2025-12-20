/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PROJECTS DOMAIN SLICE
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Handles: charts (Gantt), locations, tracking
 * Route: /app/domains/projects/*
 * Backend: /convex/domains/projects/
 * Access: Captain+ (org-scoped)
 *
 * ADP/PRISM Compliant: Full coordination fields for WARP preloading
 * ══════════════════════════════════════════════════════════════════════════════
 */

import type { StateCreator } from 'zustand';
import type { ADPSource, ADPStatus } from './_template';
import { fuseTimer } from './_template';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProjectsData {
  charts: Record<string, unknown>[];
  locations: Record<string, unknown>[];
  tracking: Record<string, unknown>[];
}

export interface ProjectsSlice extends ProjectsData {
  // ADP Coordination (REQUIRED)
  status: ADPStatus;
  lastFetchedAt?: number;
  source?: ADPSource;
}

export interface ProjectsActions {
  hydrateProjects: (data: Partial<ProjectsData>, source?: ADPSource) => void;
  clearProjects: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialProjectsState: ProjectsSlice = {
  charts: [],
  locations: [],
  tracking: [],
  // ADP Coordination
  status: 'idle',
  lastFetchedAt: undefined,
  source: undefined,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice Creator
// ─────────────────────────────────────────────────────────────────────────────

export const createProjectsSlice: StateCreator<
  ProjectsSlice & ProjectsActions,
  [],
  [],
  ProjectsSlice & ProjectsActions
> = (set) => ({
  ...initialProjectsState,

  hydrateProjects: (data, source = 'WARP') => {
    const start = fuseTimer.start('hydrateProjects');
    set((state) => ({
      ...state,
      ...data,
      status: 'hydrated',
      lastFetchedAt: Date.now(),
      source,
    }));
    if (process.env.NODE_ENV === 'development') {
      console.log(`📋 FUSE: Projects domain hydrated via ${source}`, {
        charts: data.charts?.length || 0,
        locations: data.locations?.length || 0,
        tracking: data.tracking?.length || 0,
      });
    }
    fuseTimer.end('hydrateProjects', start);
  },

  clearProjects: () => {
    const start = fuseTimer.start('clearProjects');
    set(initialProjectsState);
    fuseTimer.end('clearProjects', start);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectsStore = ProjectsSlice & ProjectsActions;
