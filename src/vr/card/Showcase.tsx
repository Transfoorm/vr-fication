/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Showcase Card                                     │
│  /src/vr/card/Showcase.tsx                                     │
│                                                                        │
│  Card variant with page-arch-color background for displaying          │
│  component demos and visual showcases.                                 │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';
import { T } from '@/vr';

export interface ShowcaseCardProps {
  title?: string;
  children: ReactNode;
}

/**
 * ShowcaseCard - Component demonstration card
 *
 * Features:
 * - Uses --page-arch-color background
 * - Clean display for component demos
 * - Optional title
 */
export default function ShowcaseCard({
  title,
  children,
}: ShowcaseCardProps) {
  return (
    <div className="vr-card vr-card-showcase">
      {title && (
        <div className="vr-card-showcase-header">
          <T.title size="sm" weight="semibold" className="vr-card-showcase-title">
            {title}
          </T.title>
        </div>
      )}
      <div className="vr-card-showcase-content">
        {children}
      </div>
    </div>
  );
}
