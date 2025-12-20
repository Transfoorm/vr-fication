/**
 * Rank Checking Utilities - Pure Functions
 *
 * Pure functions for rank comparison and validation.
 * No React dependencies - can be used anywhere (client, server, Convex).
 */

import { UserRank, RANK_HIERARCHY } from '@/rank/types';

/**
 * Check if user has minimum required rank
 *
 * @example
 * hasMinimumRank('captain', 'crew') // true (captain >= crew)
 * hasMinimumRank('crew', 'captain') // false (crew < captain)
 */
export function hasMinimumRank(
  userRank: UserRank | null | undefined,
  requiredRank: UserRank
): boolean {
  if (!userRank) return false;
  return RANK_HIERARCHY[userRank] >= RANK_HIERARCHY[requiredRank];
}

/**
 * Check if user has exact rank
 */
export function hasExactRank(
  userRank: UserRank | null | undefined,
  targetRank: UserRank
): boolean {
  return userRank === targetRank;
}

/**
 * Check if user is Admiral
 */
export function isAdmiral(userRank: UserRank | null | undefined): boolean {
  return userRank === 'admiral';
}

/**
 * Check if user is Commodore or higher
 */
export function isCommodoreOrHigher(userRank: UserRank | null | undefined): boolean {
  return hasMinimumRank(userRank, 'commodore');
}

/**
 * Check if user is Captain or higher
 */
export function isCaptainOrHigher(userRank: UserRank | null | undefined): boolean {
  return hasMinimumRank(userRank, 'captain');
}

/**
 * Check if user is Crew (base level)
 */
export function isCrew(userRank: UserRank | null | undefined): boolean {
  return userRank === 'crew';
}

/**
 * Permission check: Can control fleet (Admiral only)
 */
export function canControlFleet(userRank: UserRank | null | undefined): boolean {
  return isAdmiral(userRank);
}

/**
 * Permission check: Can manage users (Commodore+)
 */
export function canManageUsers(userRank: UserRank | null | undefined): boolean {
  return isCommodoreOrHigher(userRank);
}

/**
 * Permission check: Can moderate content (Captain+)
 */
export function canModerateContent(userRank: UserRank | null | undefined): boolean {
  return isCaptainOrHigher(userRank);
}

/**
 * Get rank display information
 */
export function getRankDisplay(userRank: UserRank | null | undefined) {
  if (!userRank) {
    return {
      rank: null,
      displayName: 'Unknown',
      level: -1,
      badgeUrl: null
    };
  }

  return {
    rank: userRank,
    displayName: userRank.charAt(0).toUpperCase() + userRank.slice(1),
    level: RANK_HIERARCHY[userRank],
    badgeUrl: `/images/rank/${userRank}.png`
  };
}
