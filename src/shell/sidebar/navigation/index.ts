/**──────────────────────────────────────────────────────────────────────┐
│  🗂️ NAVIGATION REGISTRY                                               │
│  /src/shell/Sidebar/navigation/index.ts                              │
│                                                                        │
│  Central registry for rank-based navigation structures               │
└────────────────────────────────────────────────────────────────────────┘ */

import type { NavSection, Rank } from './types';
import { crewNav } from './crew';
import { captainNav } from './captain';
import { commodoreNav } from './commodore';
import { admiralNav } from './admiral';

const NAV_REGISTRY: Record<Rank, NavSection[]> = {
  crew: crewNav,
  captain: captainNav,
  commodore: commodoreNav,
  admiral: admiralNav,
};

export function getNavForRank(rank: Rank | null | undefined): NavSection[] {
  return NAV_REGISTRY[rank ?? 'crew'] ?? crewNav;
}

export type { NavSection, Rank };
