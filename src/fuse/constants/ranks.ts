/**──────────────────────────────────────────────────────────────────────┐
│  🎖️ RANK SYSTEM CONSTANTS - Single Source of Truth                   │
│  /fuse/constants/ranks.ts                                             │
│                                                                        │
│  Rank metadata, permissions, and system defaults for the              │
│  Rank-Aware Management System.                                        │
│                                                                        │
│  Rank Hierarchy:                                                     │
│  🚢 Crew (0) → ⚓ Captain (1) → 🎖️ Commodore (2) → ⭐ Admiral (3)    │
└────────────────────────────────────────────────────────────────────────┘ */

// ═══════════════════════════════════════════════════════════════════════
// RANK TYPES
// ═══════════════════════════════════════════════════════════════════════

export type Rank = "crew" | "captain" | "commodore" | "admiral";

export type SubscriptionStatus =
  | "trial"      // Active trial period
  | "active"     // Paid subscription (Stripe/PayPal)
  | "expired"    // Trial ended, no payment
  | "lifetime"   // Granted by Admiral, never expires
  | "cancelled"; // Was paid, now cancelled (future)

// ═══════════════════════════════════════════════════════════════════════
// RANK HIERARCHY & METADATA
// ═══════════════════════════════════════════════════════════════════════

export const RANK_HIERARCHY = {
  crew: 0,
  captain: 1,
  commodore: 2,
  admiral: 3,
} as const;

export const RANK_METADATA = {
  crew: {
    label: "Crew",
    icon: "🚢",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    description: "Team Members",
    tagline: "Basic access to essential features",
    permissions: [
      "View dashboard",
      "Edit personal profile",
      "View shared resources",
      "Basic reporting",
    ],
  },
  captain: {
    label: "Captain",
    icon: "⚓",
    color: "#f59e0b",
    bgColor: "#fef3c7",
    description: "Business Owners",
    tagline: "Full feature access and team management",
    permissions: [
      "All Crew permissions",
      "Full dashboard access",
      "Create and manage projects",
      "Invite team members (Crew)",
      "Advanced analytics",
      "Export data",
      "Customization settings",
    ],
  },
  commodore: {
    label: "Commodore",
    icon: "🎖️",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    description: "Portfolio Managers",
    tagline: "Multi-organization oversight and management",
    permissions: [
      "All Captain permissions",
      "Manage multiple organizations",
      "Cross-organization reporting",
      "Portfolio analytics",
      "Bulk operations",
      "Advanced integrations",
    ],
  },
  admiral: {
    label: "Admiral",
    icon: "⭐",
    color: "#ef4444",
    bgColor: "#fee2e2",
    description: "Platform Administrators",
    tagline: "Complete platform control (God Mode)",
    permissions: [
      "All Commodore permissions",
      "User management (create, edit, delete)",
      "Rank assignment",
      "Trial & subscription control",
      "System configuration",
      "View all data",
      "Platform settings",
      "Audit logs",
    ],
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// SUBSCRIPTION STATUS METADATA
// ═══════════════════════════════════════════════════════════════════════

export const SUBSCRIPTION_METADATA = {
  trial: {
    label: "Trial",
    icon: "⏰",
    color: "#3b82f6",
    bgColor: "#dbeafe",
    description: "Active trial period",
  },
  active: {
    label: "Active",
    icon: "✓",
    color: "#10b981",
    bgColor: "#d1fae5",
    description: "Paid subscription",
  },
  expired: {
    label: "Expired",
    icon: "⚠️",
    color: "#ef4444",
    bgColor: "#fee2e2",
    description: "Trial ended",
  },
  lifetime: {
    label: "Lifetime",
    icon: "♾️",
    color: "#8b5cf6",
    bgColor: "#ede9fe",
    description: "Granted by Admiral",
  },
  cancelled: {
    label: "Cancelled",
    icon: "✕",
    color: "#6b7280",
    bgColor: "#f3f4f6",
    description: "Subscription cancelled",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM DEFAULTS (Admiral can override in settings)
// ═══════════════════════════════════════════════════════════════════════

export const RANK_SYSTEM_DEFAULTS = {
  /**
   * Default rank for new user signups
   * Admiral can change this in Configure > Settings > Rank Management
   */
  DEFAULT_RANK: "captain" as Rank,

  /**
   * Default trial duration in days
   * Admiral can change this in Configure > Settings > Rank Management
   */
  DEFAULT_TRIAL_DURATION: 14,

  /**
   * Default subscription status for new users
   */
  DEFAULT_SUBSCRIPTION_STATUS: "trial" as SubscriptionStatus,

  /**
   * Grace period (days) after trial expiration before access is restricted
   * During grace period, user keeps Captain access but sees warning banners
   */
  GRACE_PERIOD_DAYS: 3,

  /**
   * Trial warning threshold (days before expiration to show warnings)
   */
  TRIAL_WARNING_DAYS: 3,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check if rank A is higher than or equal to rank B
 */
export function rankIsAtLeast(rankA: Rank, rankB: Rank): boolean {
  return RANK_HIERARCHY[rankA] >= RANK_HIERARCHY[rankB];
}

/**
 * Get days remaining in trial
 * Returns null if no trial or already expired
 */
export function getTrialDaysRemaining(trialEndsAt?: number): number | null {
  if (!trialEndsAt) return null;

  const now = Date.now();
  const remaining = trialEndsAt - now;

  if (remaining <= 0) return 0;

  return Math.ceil(remaining / (1000 * 60 * 60 * 24));
}

/**
 * Check if trial has expired
 */
export function isTrialExpired(trialEndsAt?: number): boolean {
  if (!trialEndsAt) return false;
  return Date.now() > trialEndsAt;
}

/**
 * Check if user should see trial warning
 */
export function shouldShowTrialWarning(trialEndsAt?: number): boolean {
  const daysRemaining = getTrialDaysRemaining(trialEndsAt);
  if (daysRemaining === null) return false;

  return daysRemaining > 0 && daysRemaining <= RANK_SYSTEM_DEFAULTS.TRIAL_WARNING_DAYS;
}

/**
 * Check if user is in grace period after trial expiration
 */
export function isInGracePeriod(trialEndsAt?: number): boolean {
  if (!trialEndsAt) return false;

  const now = Date.now();
  const gracePeriodEnd = trialEndsAt + (RANK_SYSTEM_DEFAULTS.GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  return now > trialEndsAt && now < gracePeriodEnd;
}

/**
 * Calculate trial end date from duration in days
 */
export function calculateTrialEndDate(durationDays: number, startDate: number = Date.now()): number {
  return startDate + (durationDays * 24 * 60 * 60 * 1000);
}

/**
 * Format subscription status for display
 */
export function formatSubscriptionStatus(status: SubscriptionStatus): string {
  return SUBSCRIPTION_METADATA[status].label;
}

/**
 * Get rank metadata by rank
 */
export function getRankMetadata(rank: Rank) {
  return RANK_METADATA[rank];
}

/**
 * Get all ranks sorted by hierarchy
 */
export function getRanksSorted(): Rank[] {
  return Object.keys(RANK_HIERARCHY).sort(
    (a, b) => RANK_HIERARCHY[a as Rank] - RANK_HIERARCHY[b as Rank]
  ) as Rank[];
}
