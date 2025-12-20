/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Metric Card                                        │
│  /src/vr/card/metric/index.tsx                       │
│                                                                        │
│  Dashboard metric display card. Big number. Trend indicator. Context.  │
│                                                                        │
│  Usage:                                                                │
│  import { CardVC } from '@/vr/card';                │
│  <CardVC.metric                                                       │
│    title="Active Sessions"                                            │
│    value={127}                                                        │
│    trend={12}                                                          │
│    trendDirection="up"                                                │
│    context="from last week"                                           │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

import { T } from '@/vr/typography';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'flat';
  context?: string;
  className?: string;
}

/**
 * MetricCard - Key performance indicator display
 *
 * Features:
 * - Large prominent value display
 * - Optional trend indicator with direction
 * - Context text for time periods
 * - Automatic number formatting
 * - Color-coded trends
 *
 * Perfect for:
 * - KPI dashboards
 * - Analytics overviews
 * - Performance metrics
 * - Business intelligence displays
 */
export default function MetricCard({
  title,
  value,
  trend,
  trendDirection = 'flat',
  context,
  className = ''
}: MetricCardProps) {
  const trendIcon = {
    up: '↑',
    down: '↓',
    flat: '→'
  }[trendDirection];

  const trendClass = `trend-${trendDirection}`;

  return (
    <div className={`vr-card vr-card-metric ${className}`}>
      <T.body size="md" weight="medium" className="vr-card-metric-title">
        {title}
      </T.body>

      <T.title size="xl" weight="bold" className="vr-card-metric-value">
        {typeof value === 'number' && value > 1000
          ? value.toLocaleString()
          : value}
      </T.title>

      {trend !== undefined && (
        <div className={`vr-card-metric-trend ${trendClass}`}>
          <T.caption size="sm">
            {trendIcon} {Math.abs(trend)}%
            {context && <T.body size="sm" className="vr-card-metric-context"> {context}</T.body>}
          </T.caption>
        </div>
      )}

      {!trend && context && (
        <T.body size="sm" className="vr-card-metric-context">{context}</T.body>
      )}
    </div>
  );
}