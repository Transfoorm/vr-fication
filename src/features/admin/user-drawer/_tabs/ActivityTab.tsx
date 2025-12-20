/**──────────────────────────────────────────────────────────────────────┐
│  📊 ACTIVITY TAB                                                      │
│  /src/features/admin/user-drawer/_tabs/ActivityTab.tsx                │
│                                                                       │
│  Admin view of user activity:                                         │
│  - Account IDs (Convex sovereign ID)                                  │
│  - Status indicators (active, setup, subscription)                    │
│  - Login history (last login, login count)                            │
│  - Account timeline (created, updated)                                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import '../user-drawer.css';
import { Card, Badge, T } from '@/vr';
import { useAdminData } from '@/hooks/useAdminData';
import type { RankType } from '@/vr/badge/Rank';

interface ActivityTabProps {
  userId: string;
}


// Format date helper
function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format relative time
function formatRelativeTime(timestamp: number | undefined): string {
  if (!timestamp) return '—';

  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return formatDate(timestamp);
}

// Status pill component - uses data-status for CSS styling
function StatusPill({ status }: { status: string }) {
  const labels: Record<string, string> = {
    complete: 'Complete',
    pending: 'Pending',
    invited: 'Invited',
    abandon: 'Abandoned',
    revoked: 'Revoked',
    active: 'Active',
    trial: 'Trial',
    lifetime: 'Lifetime',
    expired: 'Expired',
    cancelled: 'Cancelled',
  };

  return (
    <span className="ft-activity__status-pill" data-status={status}>
      <T.caption size="xs" weight="medium">{labels[status] || status}</T.caption>
    </span>
  );
}

// Active indicator (green dot or gray)
function ActiveIndicator({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`ft-activity__active-dot ${isActive ? 'ft-activity__active-dot--active' : ''}`}
      title={isActive ? 'Active user' : 'Inactive'}
    />
  );
}

export function ActivityTab({ userId }: ActivityTabProps) {
  const { data } = useAdminData();
  const user = data.users?.find(u => String(u._id) === userId);

  if (!user) return <T.body>User not found</T.body>;

  // Determine if user is "active" based on login within last 30 days
  const lastLogin = user.lastLoginAt as number | undefined;
  const daysSinceLogin = lastLogin ? Math.floor((Date.now() - lastLogin) / 86400000) : 999;
  const isActive = lastLogin && daysSinceLogin <= 30;

  return (
    <div className="ft-activity">
      {/* Identity Card */}
      <Card.standard
        title="Account Identity"
        subtitle="Unique identifiers for this user"
      >
        <div className="ft-activity__grid">
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Convex ID</T.caption>
            <code className="ft-activity__value ft-activity__value--mono"><T.caption size="xs">{userId}</T.caption></code>
          </div>
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Rank</T.caption>
            <span className="ft-activity__value">
              <Badge.rank rank={user.rank as RankType} />
            </span>
          </div>
        </div>
      </Card.standard>

      {/* Status Card */}
      <Card.standard
        title="Status"
        subtitle="Current account state"
      >
        <div className="ft-activity__grid">
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Active (last month)</T.caption>
            <T.body size="sm" weight="semibold" className="ft-activity__value">
              <ActiveIndicator isActive={!!isActive} />
              {isActive ? 'Yes' : 'No'}
            </T.body>
          </div>
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Setup Status</T.caption>
            <span className="ft-activity__value">
              <StatusPill status={String(user.setupStatus)} />
            </span>
          </div>
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Subscription</T.caption>
            <span className="ft-activity__value">
              <StatusPill status={String(user.subscriptionStatus || 'trial')} />
            </span>
          </div>
        </div>
      </Card.standard>

      {/* Login History Card */}
      <Card.standard
        title="Login History"
        subtitle="Account access information"
      >
        <div className="ft-activity__grid">
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Last Login</T.caption>
            <T.body size="sm" weight="semibold" className="ft-activity__value">
              {formatRelativeTime(lastLogin)}
              {lastLogin && <T.caption className="ft-activity__subtext">{formatDate(lastLogin)}</T.caption>}
            </T.body>
          </div>
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Login Count</T.caption>
            <T.body size="sm" weight="semibold" className="ft-activity__value">{(user.loginCount as number) ?? 0}</T.body>
          </div>
        </div>
      </Card.standard>

      {/* Timeline Card */}
      <Card.standard
        title="Timeline"
        subtitle="Account lifecycle dates"
      >
        <div className="ft-activity__grid">
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Created</T.caption>
            <T.body size="sm" weight="semibold" className="ft-activity__value">{formatDate(user.createdAt as number)}</T.body>
          </div>
          <div className="ft-activity__row">
            <T.caption className="ft-activity__label">Last Updated</T.caption>
            <T.body size="sm" weight="semibold" className="ft-activity__value">{formatDate(user.updatedAt as number)}</T.body>
          </div>
        </div>
      </Card.standard>
    </div>
  );
}
