/**──────────────────────────────────────────────────────────────────────────┐
│  📧 EMAIL DOMAIN - Export Hub                                              │
│  /src/domains/email/index.ts                                               │
│                                                                            │
│  Central export for canonical email taxonomy and provider mappings.        │
└────────────────────────────────────────────────────────────────────────────*/

// Canonical taxonomy
export {
  CanonicalFolder,
  CanonicalState,
  MailProvider,
  ResolutionState,
  VISIBLE_FOLDERS,
  LEGACY_RESOLUTION_MAP,
  isCanonicalFolder,
  isCanonicalState,
  isMailProvider,
  isResolutionState,
  migrateLegacyResolutionState,
} from './canonical';

// Provider mappings
export * from './mappings';
