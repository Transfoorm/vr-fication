/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - User Rank Table                                   │
│  /src/prebuilts/rank/Table.tsx                                        │
│                                                                        │
│  TRUE VR: Complete user management table with rank controls.          │
│  Reads from FUSE store (WARP preloaded), handles rank changes.        │
│                                                                        │
│  Usage:                                                               │
│  <UserRankTable />                                                    │
│  That's it. Zero configuration. It handles EVERYTHING.                │
│                                                                        │
│  FUSE/ADP Compliant: Reads from admin slice, no direct Convex query.  │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useFuse } from '@/store/fuse';
import type { Id } from '@/convex/_generated/dataModel';
import { Table } from '@/vr';
import type { SortableColumn } from '@/vr/table/Sortable';
import BadgeRank from '@/vr/badge/Rank';
import BadgeSetup from '@/vr/badge/Setup';
import type { SetupStatusType } from '@/vr/badge/Setup';
import RankSelector from './RankSelector';
import { useConvexUser } from '@/hooks/useConvexUser';
import { T } from '@/vr/typography';

type UserRank = 'admiral' | 'commodore' | 'captain' | 'crew';

interface UserData {
  _id: Id<'admin_users'>;
  firstName?: string;
  lastName?: string;
  email?: string;
  rank?: UserRank;
  setupStatus?: SetupStatusType;
  trialEndsAt?: number;
}

/**
 * UserRankTable - Intelligent user management table
 *
 * FUSE/ADP Features:
 * - Reads users from FUSE admin slice (WARP preloaded)
 * - Calculates trial days remaining
 * - Shows user status (pending/active)
 * - Handles rank changes via Convex mutation
 * - Updates database on selection
 * - Prevents Admiral self-demotion (UX-level protection)
 * - Zero loading states (data is preloaded)
 * - TTT Gap Model compliant
 *
 * This is what FUSE/ADP Architecture is about!
 */
export default function UserRankTable() {
  // Read from FUSE store - data preloaded by WARP
  const { users: fuseUsers, status } = useFuse((state) => state.admin);

  // TTTS-1 compliant: status === 'hydrated' means data is ready (ONE source of truth)
  const isHydrated = status === 'hydrated';
  const users = fuseUsers as unknown as UserData[] | undefined;
  const currentUser = useConvexUser();
  const setUserRank = useMutation(api.domains.admin.users.api.setUserRank);
  const [changingRank, setChangingRank] = useState<string | null>(null);

  // Calculate days left for trial users
  const calculateDaysLeft = (trialEndsAt?: number) => {
    if (!trialEndsAt) return null;
    const now = Date.now();
    const days = Math.ceil((trialEndsAt - now) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleRankChange = async (userId: Id<'admin_users'>, newRank: UserRank) => {
    setChangingRank(userId);
    try {
      // 🛡️ S.I.D. Phase 15: Pass callerUserId (sovereign) to mutation
      if (!currentUser?.id) throw new Error('Not authenticated');
      await setUserRank({
        userId,
        rank: newRank,
        callerUserId: currentUser.id as Id<'admin_users'>
      });
    } catch (error) {
      console.error('Failed to update rank:', error);
    } finally {
      setChangingRank(null);
    }
  };

  // Show nothing until hydrated (FUSE doctrine: no loading spinners)
  // TTTS-1 compliant: isHydrated already checks status === 'hydrated'
  if (!isHydrated || !users) {
    return null;
  }

  // Define table columns using Table.sortable VR
  // Matches User Directory styling exactly - plain text, no Typography VR
  const rankColumns: SortableColumn<UserData>[] = [
    {
      key: 'firstName',
      header: 'User',
      sortable: true,
      width: '18%',
      render: (_: unknown, user: UserData) => {
        const isCurrentUser = currentUser?.id === user._id;
        const name = user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.firstName || user.lastName || '—';

        if (!isCurrentUser) {
          return name;
        }

        return (
          <span>
            {name}
            <span className="vr-current-user-badge">
              (You)
            </span>
          </span>
        );
      }
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '22%',
      render: (_: unknown, user: UserData) => (
        <span className="vr-rank-table-email">
          {user.email || '—'}
        </span>
      )
    },
    {
      key: 'setupStatus',
      header: 'Status',
      sortable: true,
      width: '12%',
      render: (_: unknown, user: UserData) => <BadgeSetup status={user.setupStatus || 'pending'} />
    },
    {
      key: 'trialDays',
      header: 'Trial Days',
      sortable: true,
      width: '12%',
      render: (_: unknown, user: UserData) => {
        const daysLeft = calculateDaysLeft(user.trialEndsAt);
        if (daysLeft === null) return '—';

        // VR-compliant: data-attribute for urgency styling (CSS in rank-table.css)
        return (
          <span className="vr-trial-days" data-urgency={daysLeft <= 3 ? 'high' : 'normal'}>
            {daysLeft} days
          </span>
        );
      }
    },
    {
      key: 'rank',
      header: 'Current Rank',
      sortable: true,
      width: '14%',
      render: (_: unknown, user: UserData) => <BadgeRank rank={user.rank || 'crew'} />
    },
    {
      key: 'actions',
      header: 'Change Rank',
      sortable: false,
      width: '22%',
      render: (_: unknown, user: UserData) => {
        // 🔒 UX Protection: Prevent Admiral from changing their own rank
        const isCurrentUser = currentUser?.id === user._id;
        const isAdmiral = user.rank === 'admiral';
        const isOwnAdmiralRow = isCurrentUser && isAdmiral;

        return (
          <div className="vr-rank-actions-cell">
            <div className="vr-rank-selector-wrapper">
              <RankSelector
                value={user.rank || 'crew'}
                onChange={(rank) => handleRankChange(user._id, rank as UserRank)}
                disabled={changingRank === user._id || isOwnAdmiralRow}
              />
              {isOwnAdmiralRow && (
                <div className="vr-rank-selector-disabled-tooltip">
                  <T.caption>🔒 Cannot change your own rank</T.caption>
                </div>
              )}
            </div>
            {changingRank === user._id && (
              <span className="vr-updating-indicator"><T.caption>Updating...</T.caption></span>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="vr-rank-table">
      <Table.sortable
        columns={rankColumns}
        data={users}
        striped
        bordered
      />

      {users.length === 0 && (
        <div className="vr-empty-state">
          <T.body>No users found</T.body>
        </div>
      )}
    </div>
  );
}
