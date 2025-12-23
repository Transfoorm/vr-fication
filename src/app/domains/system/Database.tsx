/**──────────────────────────────────────────────────────────────────────┐
│  🗄️ DATABASE - Sovereign Domain                                       │
│  /src/app/domains/system/Database.tsx                                 │
│                                                                        │
│  VR Doctrine: Domain Layer (Clean)                                    │
│  - Feature imports only                                               │
│  - ZERO FUSE                                                          │
│  - ZERO callbacks                                                     │
│  - ZERO state                                                         │
│  - Pure declaration                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { DatabasePageFeature } from '@/features/system/database-page';
import { Page } from '@/vr';

export default function Database() {
  useSetPageHeader('Database', 'Database integrity monitoring and health checks');
  usePageTiming('/system/database');

  return (
    <Page.constrained>
      <DatabasePageFeature />
    </Page.constrained>
  );
}
