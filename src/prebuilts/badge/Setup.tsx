/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Setup Status Badge                                │
│  /src/prebuilts/badge/Setup.tsx                                       │
│                                                                        │
│  Border-only badge for setup status (complete, pending, invited, etc).│
│                                                                        │
│  Usage:                                                                │
│  import { Badge } from '@/prebuilts';                      │
│  <Badge.setup status="complete" />                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

export type SetupStatusType = 'complete' | 'pending' | 'invited' | 'abandon' | 'revoked' | null | undefined;

export interface SetupBadgeProps {
  status: SetupStatusType;
  className?: string;
}

/**
 * SetupBadge - Border-only badge for setup status
 *
 * Same size and dimensions as rank badges.
 * No background colors - just border and text.
 *
 * Statuses:
 * - complete
 * - pending
 * - invited
 * - abandon
 * - revoked
 *
 * Perfect for:
 * - User onboarding status
 * - Setup progress indicators
 * - Account completion tracking
 */
export default function SetupBadge({ status, className = '' }: SetupBadgeProps) {
  const statusText = status || '—';
  const statusClass = status ? `vr-badge-setup-${status}` : '';

  return (
    <span className={`vr-badge-setup ${statusClass} ${className}`}>
      {statusText}
    </span>
  );
}
