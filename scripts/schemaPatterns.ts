/**
 * TTT SCHEMA FIELD SCANNER - Pattern Definitions
 *
 * Patterns for identifying correctly optional fields and upgrade opportunities.
 * Extracted to reduce checkSchemaFields.ts file size.
 */

// ═══════════════════════════════════════════════════════════════════════════
// CORRECTLY OPTIONAL PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
// These identify fields that are CORRECTLY optional (null has meaning).
// They should NOT be flagged as nuke opportunities.

export const CORRECTLY_OPTIONAL_PATTERNS = [
  // Error states - only exist when something breaks
  /Error$/,
  /^lastSyncError$/,
  /^lastError$/,
  /^errorMessage$/,
  /^clerkDeletionError$/,

  // Conditional timestamps - only exist when event occurs
  /^deletedAt$/,
  /^resolvedAt$/,
  /^completedAt$/,
  /^disconnectedAt$/,
  /^confirmedAt$/,
  /^syncStartedAt$/,
  /^lastNotificationAt$/,
  /^assetsProcessedAt$/,
  /^readAt$/,
  /^promotedAt$/,
  /^subscriptionStartedAt$/,
  /^subscriptionRenewsAt$/,
  /^lastPaymentAt$/,
  /^trialStartedAt$/,
  /^trialEndsAt$/,

  // External provider IDs - only exist after provider integration
  /^stripe/,
  /^paypal/,
  /^gmail/,
  /^outlook/,
  /^delta/,
  /Token$/,

  // AI/ML results - only exist after processing
  /^ai/i,
  /Classification$/,
  /Confidence$/,
  /Explanation$/,
  /^intent$/,
  /^priority$/,
  /^senderType$/,

  // Sync cursors and cache
  /HistoryId$/,
  /^syncLockTTL$/,
  /^foldersCachedAt$/,
  /^deltaTokenUpdatedAt$/,

  // Nullable relationships (null = not assigned)
  /^resolvedBy$/,
  /^confirmedBy$/,
  /^assignedTo$/,
  /^promotedTo$/,

  // Provider-specific data (only exists for certain providers)
  /^providerVariant$/,
  /^providerFolderId$/,
  /^providerFolderName$/,
  /^providerLabels$/,
  /^providerCategories$/,
  /^canonicalStates$/,

  // Conditional sync state
  /^initialSyncComplete$/,
  /^newEmailsDetectedAt$/,
  /^isSyncing$/,
  /^isBackgroundPolling$/,

  // Deletion tracking
  /^deletionStatus$/,
  /^reason$/,

  // Optional profile fields (user may not fill these)
  /^notes$/,
  /^description$/,
  /^secondaryEmail$/,
  /^phoneNumber$/,
  /^company$/,
  /^jobTitle$/,
  /^department$/,
  /^seniority$/,
  /^industry$/,
  /^companySize$/,
  /^companyWebsite$/,
  /^teamSize$/,
  /^annualRevenue$/,
  /^successMetric$/,
  /^howDidYouHearAboutUs$/,
  /^transformation/,
  /^timeline/,

  // Optional message fields
  /^cc$/,
  /^cidReference$/,
  /^originalUrl$/,
  /^s3Key$/,

  // Genome fields (survey - all optional by design)
  /^genome\./,

  // Token expiry (only exists for OAuth)
  /^tokenExpiresAt$/,
  /^accessToken$/,
  /^refreshToken$/,

  // Trial fields (only exist during trial)
  /^trialDuration$/,

  // Last sync (only exists after first sync)
  /^lastSyncAt$/,
  /^nextSyncAt$/,

  // End date (project may be ongoing)
  /^endDate$/,

  // Owner email denormalization (optional for performance)
  /^ownerEmail$/,
];

// ═══════════════════════════════════════════════════════════════════════════
// UPGRADEABLE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════
// Fields that COULD become required with a default value.
// Only simple types (boolean, string) - NOT union types.

export const UPGRADEABLE_PATTERNS: Array<{
  pattern: RegExp;
  defaultValue: string;
  reason: string;
}> = [
  // Boolean preferences - default to true or false
  { pattern: /^emailSound/, defaultValue: 'true', reason: 'Sound preference (default on)' },
  { pattern: /^mirorEnchantmentEnabled$/, defaultValue: 'false', reason: 'Feature flag (default off)' },
  { pattern: /^themeDark$/, defaultValue: 'false', reason: 'Theme preference (default light)' },

  // String with empty default
  { pattern: /^entityName$/, defaultValue: '""', reason: 'Display name (default empty)' },
  { pattern: /^socialName$/, defaultValue: '""', reason: 'Social handle (default empty)' },
  { pattern: /^orgSlug$/, defaultValue: '""', reason: 'Org identifier (default empty)' },
  { pattern: /^businessCountry$/, defaultValue: '""', reason: 'Country (default empty)' },

  // Mode/state with sensible default
  { pattern: /^emailMarkReadMode$/, defaultValue: '"timer"', reason: 'Read mode (default timer)' },
];

// ═══════════════════════════════════════════════════════════════════════════
// UNION CHOICE FIELDS
// ═══════════════════════════════════════════════════════════════════════════
// Union types that require user choice - no sensible default.
// They should STAY optional.

export const UNION_CHOICE_FIELDS = [
  'mirorAvatarProfile',     // User picks from 9 avatar options
  'mirorEnchantmentTiming', // User picks subtle/magical/playful
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function isCorrectlyOptional(fieldName: string): boolean {
  if (CORRECTLY_OPTIONAL_PATTERNS.some(pattern => pattern.test(fieldName))) {
    return true;
  }
  if (UNION_CHOICE_FIELDS.includes(fieldName)) {
    return true;
  }
  return false;
}

export function getUpgradeInfo(fieldName: string): { defaultValue: string; reason: string } | null {
  for (const { pattern, defaultValue, reason } of UPGRADEABLE_PATTERNS) {
    if (pattern.test(fieldName)) {
      return { defaultValue, reason };
    }
  }
  return null;
}
