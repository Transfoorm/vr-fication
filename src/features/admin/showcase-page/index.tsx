/**──────────────────────────────────────────────────────────────────────┐
│  🎪 SHOWCASE FEATURE                                                 │
│  /src/features/admin/showcase-page/index.tsx                         │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  Exports showcase tab components from _tabs subdirectory              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './showcase-page.css';

// Export tab components from _tabs
export { VrGuideTab } from './_tabs/VrGuideTab';
export { FtGuideTab } from './_tabs/FtGuideTab';
export { ButtonsTab } from './_tabs/ButtonsTab';
export { CardsTab } from './_tabs/CardsTab';
export { FieldsTab } from './_tabs/FieldsTab';
export { RadiosTab } from './_tabs/RadiosTab';
export { TooltipsTab } from './_tabs/TooltipsTab';
export { TypographyTab } from './_tabs/TypographyTab';
