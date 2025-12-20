/**──────────────────────────────────────────────────────────────────────┐
│  🗄️ DATABASE - Sovereign Domain                                       │
│  /src/app/domains/admin/database/Database.tsx                         │
│                                                                        │
│  VR Doctrine: Domain Layer (Clean)                                    │
│  - Page route and structure only                                      │
│  - Imports Feature (DBCheckFeature)                                   │
│  - No FUSE wiring, no business logic                                  │
│  - Admiral rank only                                                  │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { DBCheckFeature } from '@/features/system/database/db-check';

export default function Database() {
  useSetPageHeader("Database", 'Database integrity monitoring and health checks');
  usePageTiming('/system/database');

  return <DBCheckFeature />;
}
