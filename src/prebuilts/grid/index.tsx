/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Grid Component Registry                           │
│  /src/prebuilts/grid/index.tsx                                        │
│                                                                        │
│  Universal layout system using CSS Grid.                              │
│  Replaces Stack with more powerful and flexible layouts.              │
│                                                                        │
│  Usage:                                                                │
│  import { Grid } from '@/prebuilts/grid';                             │
│                                                                        │
│  <Grid.vertical>{children}</Grid.vertical>                            │
│  <Grid.cards>{cards}</Grid.cards>                                     │
│  <Grid.dashboard>{metrics}</Grid.dashboard>                           │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

interface GridProps {
  children: ReactNode;
  className?: string;
}

// Vertical layout (replaces Stack)
const GridVertical = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-vertical ${className}`}>
    {children}
  </div>
);

// Vertical tight spacing
const GridVerticalTight = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-vertical-tight ${className}`}>
    {children}
  </div>
);

// Vertical loose spacing
const GridVerticalLoose = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-vertical-loose ${className}`}>
    {children}
  </div>
);

// Vertical big spacing (2xl gap)
const GridVerticalBig = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-vertical-big ${className}`}>
    {children}
  </div>
);

// Horizontal layout (replaces Stack.horizontal)
const GridHorizontal = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-horizontal ${className}`}>
    {children}
  </div>
);

// Responsive card grid
const GridCards = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-cards ${className}`}>
    {children}
  </div>
);

// Dashboard grid (3-column)
const GridDashboard = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-dashboard ${className}`}>
    {children}
  </div>
);

// 2-column grid
const GridTwoColumn = ({ children, className = '' }: GridProps) => (
  <div className={`vr-grid-two-column ${className}`}>
    {children}
  </div>
);

export const Grid = Object.assign(GridVertical, {
  vertical: GridVertical,
  verticalTight: GridVerticalTight,
  verticalLoose: GridVerticalLoose,
  verticalBig: GridVerticalBig,
  horizontal: GridHorizontal,
  cards: GridCards,
  dashboard: GridDashboard,
  twoColumn: GridTwoColumn,
});

export {
  GridVertical,
  GridVerticalTight,
  GridVerticalLoose,
  GridVerticalBig,
  GridHorizontal,
  GridCards,
  GridDashboard,
  GridTwoColumn,
};

export type GridVerticalProps = GridProps;
export type GridHorizontalProps = GridProps;
export type GridCardsProps = GridProps;
export type GridDashboardProps = GridProps;
export type GridTwoColumnProps = GridProps;
