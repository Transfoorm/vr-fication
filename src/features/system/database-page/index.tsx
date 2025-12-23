/**──────────────────────────────────────────────────────────────────────┐
│  🗄️ DATABASE PAGE FEATURE                                            │
│  /src/features/system/database-page/index.tsx                         │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Owns Tabs.panels                                                   │
│  - Imports tab components from _tabs/                                 │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './database-page.css';

import { Tabs, Stack, Icon } from '@/vr';
import { ChecksTab } from './_tabs/ChecksTab';
import { PanelTwoTab } from './_tabs/PanelTwoTab';
import { PanelThreeTab } from './_tabs/PanelThreeTab';

export function DatabasePageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'checks', label: 'Checks', icon: <Icon variant="check-circle" />, content: <ChecksTab /> },
          { id: 'panel-two', label: 'Panel Two', icon: <Icon variant="table-properties" />, content: <PanelTwoTab /> },
          { id: 'panel-three', label: 'Panel Three', icon: <Icon variant="cog" />, content: <PanelThreeTab /> },
        ]}
      />
    </Stack>
  );
}
