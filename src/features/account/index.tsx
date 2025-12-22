/**──────────────────────────────────────────────────────────────────────┐
│  🔱 ACCOUNT FEATURE                                                  │
│  /src/features/account/index.tsx                                     │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  Exports account page and tab components from _tabs subdirectory     │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './account.css';

// Export account page feature
export { AccountPageFeature } from './AccountPageFeature';

// Export tab components from _tabs
export { ProfileFields } from './_tabs/ProfileTab';
export { EmailFields } from './_tabs/EmailTab';
export { PasswordFields } from './_tabs/PasswordTab';
export { GenomeFields } from './_tabs/GenomeTab';
