/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Cascade Status Badge                              │
│  /src/prebuilts/badge/Cascade.tsx                                     │
│                                                                        │
│  Border-only badge for cascade deletion status (completed, failed).   │
│                                                                        │
│  Usage:                                                                │
│  import { Badge } from '@/prebuilts';                      │
│  <Badge.cascade status="completed" />                                 │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

export type CascadeStatusType = 'success' | 'failed' | 'running' | null | undefined;

export interface CascadeBadgeProps {
  status: CascadeStatusType;
  className?: string;
}

/**
 * CascadeBadge - Border-only badge for cascade deletion status
 *
 * Same size and dimensions as rank/setup badges.
 * Border styling with no background - just border and text color.
 *
 * Statuses:
 * - success: Green border
 * - failed: Red border
 * - running: Orange border
 *
 * Perfect for:
 * - Deletion status tracking
 * - Cascade operation results
 * - VANISH journal indicators
 */
export default function CascadeBadge({ status, className = '' }: CascadeBadgeProps) {
  const statusText = status || '—';
  const statusClass = status ? `vr-badge-cascade-${status}` : '';

  return (
    <span className={`vr-badge-cascade ${statusClass} ${className}`}>
      {statusText}
    </span>
  );
}
