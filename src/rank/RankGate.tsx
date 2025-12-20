/**
 * RankGate Component - Conditional rendering based on user rank
 *
 * Provides declarative components for protecting UI elements based on rank.
 *
 * Usage:
 * ```tsx
 * <RankGate minRank="captain">
 *   <AdminPanel />
 * </RankGate>
 *
 * <RankGate.exact rank="admiral">
 *   <FleetControl />
 * </RankGate.exact>
 *
 * <RankGate minRank="commodore" fallback={<UpgradePrompt />}>
 *   <PremiumFeature />
 * </RankGate>
 * ```
 */

'use client';

import React from 'react';
import { useRankCheck } from '@/fuse/hydration/hooks/useRankCheck';
import type { UserRank } from '@/rank/types';

interface RankGateProps {
  /** Minimum rank required to see children */
  minRank: UserRank;
  /** Children to render if rank check passes */
  children: React.ReactNode;
  /** Optional fallback to render if rank check fails */
  fallback?: React.ReactNode;
}

interface RankGateExactProps {
  /** Exact rank required to see children */
  rank: UserRank;
  /** Children to render if rank matches */
  children: React.ReactNode;
  /** Optional fallback to render if rank doesn&apos;t match */
  fallback?: React.ReactNode;
}

/**
 * Render children only if user has minimum required rank
 */
export function RankGate({ minRank, children, fallback = null }: RankGateProps) {
  const { hasMinimumRank } = useRankCheck();

  if (hasMinimumRank(minRank)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Render children only if user has exact rank
 */
RankGate.exact = function RankGateExact({ rank, children, fallback = null }: RankGateExactProps) {
  const { userRank } = useRankCheck();

  if (userRank === rank) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Render children only for Admiral rank
 */
RankGate.admiral = function RankGateAdmiral({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isAdmiral } = useRankCheck();

  if (isAdmiral()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Render children only for Commodore or higher
 */
RankGate.commodore = function RankGateCommodore({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isCommodoreOrHigher } = useRankCheck();

  if (isCommodoreOrHigher()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * Render children only for Captain or higher
 */
RankGate.captain = function RankGateCaptain({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const { isCaptainOrHigher } = useRankCheck();

  if (isCaptainOrHigher()) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default RankGate;
