/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Badge Status                                       │
│  /src/prebuilts/badge/Status.tsx                                       │
│                                                                        │
│  Status badge with semantic colors for system states.                 │
└────────────────────────────────────────────────────────────────────────┘ */

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'disabled';

export interface BadgeStatusProps {
  /** Status variant */
  variant: StatusVariant;
  /** Display text */
  children: React.ReactNode;
  /** Show dot indicator */
  showDot?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
}

/**
 * BadgeStatus - Status indicator badge with semantic colors
 * TTT Gap Model compliant - no external margins
 */
export default function BadgeStatus({
  variant,
  children,
  showDot = false,
  size = 'md',
  className = ''
}: BadgeStatusProps) {
  const classes = [
    'vr-badge-status',
    `vr-badge-status--${variant}`,
    `vr-badge-status--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {showDot && <span className="vr-badge-status-dot" />}
      {children}
    </span>
  );
}
