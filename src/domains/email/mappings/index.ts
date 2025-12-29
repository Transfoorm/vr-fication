/**──────────────────────────────────────────────────────────────────────────┐
│  📧 PROVIDER MAPPINGS - Export Hub                                         │
│  /src/domains/email/mappings/index.ts                                      │
└────────────────────────────────────────────────────────────────────────────*/

// Gmail
export {
  mapGmailFolder,
  extractGmailStates,
  extractGmailCategories,
  extractGmailUserLabels,
  mapGmailMessage,
  GmailFolderMap,
  type GmailCanonicalMapping,
} from './gmail';

// Outlook
export {
  mapOutlookFolder,
  extractOutlookStates,
  extractOutlookCategories,
  mapOutlookMessage,
  type OutlookMessageFlags,
  type OutlookMessageInput,
  type OutlookCanonicalMapping,
} from './outlook';

// Yahoo
export {
  mapYahooFolder,
  extractYahooStates,
  mapYahooMessage,
  YahooFolders,
  type YahooMessageFlags,
  type YahooMessageInput,
  type YahooCanonicalMapping,
} from './yahoo';
