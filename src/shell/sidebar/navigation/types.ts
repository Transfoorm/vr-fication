/**──────────────────────────────────────────────────────────────────────┐
│  🔷 NAVIGATION TYPES                                                  │
│  /src/shell/Sidebar/navigation/types.ts                              │
│                                                                        │
│  TypeScript interfaces for sidebar navigation structure              │
└────────────────────────────────────────────────────────────────────────┘ */

import type { IconVariant } from '@/prebuilts';

export interface NavChild {
  path: string;
  label: string;
}

export interface NavSection {
  label: string;
  icon: IconVariant;
  path?: string;
  children?: NavChild[];
}

export type Rank = 'crew' | 'captain' | 'commodore' | 'admiral';
