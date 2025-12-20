// FUSE Rank Check Hook
// Following User Rank system: Developer-only feature gating
//
// Provides instant rank verification for UI components and route protection
//
// Uses centralized rank checking functions from @/rank for consistency

import React from 'react';
import { useFuse } from '@/store/fuse';
import {
  UserRank,
  hasMinimumRank as checkMinimumRank,
  hasExactRank,
  isAdmiral as checkIsAdmiral,
  isCommodoreOrHigher as checkIsCommodoreOrHigher,
  isCaptainOrHigher as checkIsCaptainOrHigher,
  isCrew as checkIsCrew,
  canControlFleet as checkCanControlFleet,
  canManageUsers as checkCanManageUsers,
  canModerateContent as checkCanModerateContent,
  getRankDisplay as getDisplay
} from '@/rank';

/**
 * FUSE Hook for instant rank checking
 * Uses cached user data from FUSE store for zero-query performance
 */
export function useRankCheck() {
  const user = useFuse(s => s.user);
  const userRank = (user?.rank as UserRank) || 'crew';

  // Specific rank checks (closures that pass userRank to centralized functions)
  const isAdmiral = () => checkIsAdmiral(userRank);
  const isCommodore = () => hasExactRank(userRank, 'commodore');
  const isCaptain = () => hasExactRank(userRank, 'captain');
  const isCrew = () => checkIsCrew(userRank);

  // Minimum rank checks (hierarchical)
  const isAdmiralOrHigher = () => checkIsAdmiral(userRank);
  const isCommodoreOrHigher = () => checkIsCommodoreOrHigher(userRank);
  const isCaptainOrHigher = () => checkIsCaptainOrHigher(userRank);

  // Rank comparison utility
  const hasMinimumRank = (minimumRank: UserRank): boolean => {
    return checkMinimumRank(userRank, minimumRank);
  };

  // Get rank display info
  const getRankDisplay = () => getDisplay(userRank);

  // Fleet Control permissions
  const canControlFleet = () => checkCanControlFleet(userRank);
  const canManageUsers = () => checkCanManageUsers(userRank);
  const canModerateContent = () => checkCanModerateContent(userRank);

  return {
    // Current user rank
    userRank,

    // Specific rank checks
    isAdmiral,
    isCommodore,
    isCaptain,
    isCrew,

    // Hierarchical checks
    isAdmiralOrHigher,
    isCommodoreOrHigher,
    isCaptainOrHigher,

    // Utility functions
    hasMinimumRank,
    getRankDisplay,

    // Permission shortcuts
    canControlFleet,
    canManageUsers,
    canModerateContent,

    // User info
    isLoggedIn: !!user,
    user
  };
}

/**
 * HOC for protecting components based on rank
 */
export function withRankProtection<T extends object>(
  Component: React.ComponentType<T>,
  minimumRank: UserRank,
  fallbackComponent?: React.ComponentType
) {
  return function ProtectedComponent(props: T) {
    const { hasMinimumRank } = useRankCheck();

    if (!hasMinimumRank(minimumRank)) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return React.createElement(FallbackComponent);
      }

      return React.createElement('div', {
        className: 'fuse-rank-restricted'
      }, [
        React.createElement('h3', { key: 'title' }, 'Access Restricted'),
        React.createElement('p', { key: 'message' }, `This feature requires ${minimumRank} rank or higher.`)
      ]);
    }

    return React.createElement(Component, props);
  };
}
