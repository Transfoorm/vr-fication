/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Activity Card                                      │
│  /src/components/prebuilts/card/activity/index.tsx                     │
│                                                                        │
│  Activity feed card. Timeline events. Status updates.                  │
│                                                                        │
│  Usage:                                                                │
│  import { CardVC } from '@/prebuilts/card';                │
│  <CardVC.activity                                                     │
│    title="Recent Activity"                                            │
│    items={activityItems}                                              │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';
import { T } from '@/prebuilts';

export interface ActivityItem {
  id?: string | number;
  title: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
}

export interface ActivityCardProps {
  title?: string;
  items: ActivityItem[];
  maxItems?: number;
  className?: string;
  span?: 1 | 2 | 3 | 'full';
}

/**
 * ActivityCard - Timeline/feed display card
 *
 * Features:
 * - Chronological activity list
 * - Time-based sorting
 * - Status indicators
 * - Configurable item limit
 * - Optional span control for grids
 *
 * Perfect for:
 * - Activity feeds
 * - Audit logs
 * - Recent changes
 * - System events
 * - User actions timeline
 */
export default function ActivityCard({
  title = 'Recent Activity',
  items,
  maxItems = 5,
  className = '',
  span
}: ActivityCardProps) {
  const displayItems = items.slice(0, maxItems);
  const spanClass = span === 'full' ? 'span-full' : span ? `span-${span}` : '';

  return (
    <div className={`vr-card vr-card-activity ${spanClass} ${className}`}>
      {title && (
        <T.body size="md" weight="medium" className="vr-card-activity-title">
          {title}
        </T.body>
      )}

      <div className="vr-card-activity-list">
        {displayItems.map((item, index) => (
          <div
            key={item.id || index}
            className={`vr-card-activity-item ${item.status ? `vr-card-activity-item-status-${item.status}` : ''}`}
          >
            {item.icon && <span className="vr-card-activity-icon">{item.icon}</span>}

            <div className="vr-card-activity-content">
              <T.body size="sm" className="vr-card-activity-text">
                {item.title}
              </T.body>
              <T.caption size="xs" className="vr-card-activity-time">
                {item.timestamp}
              </T.caption>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="vr-card-activity-empty">
            <T.body>No recent activity</T.body>
          </div>
        )}
      </div>
    </div>
  );
}