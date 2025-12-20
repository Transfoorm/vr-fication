/**
 * Rank System - Access Control and Navigation Gate
 * Core system for managing user ranks and navigation permissions
 *
 * Single source of truth for all rank-related functionality:
 * - Type definitions (UserRank)
 * - Hierarchy values (RANK_HIERARCHY)
 * - Pure checking functions (hasMinimumRank, isAdmiral, etc.)
 * - React components (RankGate for UI protection)
 */

// Core types and constants
export type { UserRank } from '@/rank/types';
export { RANK_HIERARCHY } from '@/rank/types';

// Pure checking functions (framework-agnostic)
export {
  hasMinimumRank,
  hasExactRank,
  isAdmiral,
  isCommodoreOrHigher,
  isCaptainOrHigher,
  isCrew,
  canControlFleet,
  canManageUsers,
  canModerateContent,
  getRankDisplay
} from '@/rank/checks';

// React components
export { default as RankGate } from '@/rank/RankGate';
