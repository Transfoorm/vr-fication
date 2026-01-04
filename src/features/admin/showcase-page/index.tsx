/**──────────────────────────────────────────────────────────────────────┐
│  🎪 SHOWCASE PAGE FEATURE                                            │
│  /src/features/admin/showcase-page/index.tsx                         │
│                                                                       │
│  VR Doctrine: Feature Layer                                          │
│  - Owns Tabs.panels                                                  │
│  - Imports tab components from _tabs/                                │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './showcase-page.css';

import { Tabs, Stack } from '@/vr';
import { VrGuideTab } from './_tabs/VrGuideTab';
import { FtGuideTab } from './_tabs/FtGuideTab';
import { ButtonsTab } from './_tabs/ButtonsTab';
import { CardsTab } from './_tabs/CardsTab';
import { FieldsTab } from './_tabs/FieldsTab';
import { RadiosTab } from './_tabs/RadiosTab';
import { TogglesTab } from './_tabs/TogglesTab';
import { TooltipsTab } from './_tabs/TooltipsTab';
import { TypographyTab } from './_tabs/TypographyTab';

export function ShowcasePageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'vr', label: 'VR Guide', content: <VrGuideTab /> },
          { id: 'ft', label: 'FT Guide', content: <FtGuideTab /> },
          { id: 'buttons', label: 'Buttons', content: <ButtonsTab /> },
          { id: 'cards', label: 'Cards', content: <CardsTab /> },
          { id: 'fields', label: 'Fields', content: <FieldsTab /> },
          { id: 'radios', label: 'Radios', content: <RadiosTab /> },
          { id: 'toggles', label: 'Toggles', content: <TogglesTab /> },
          { id: 'tooltips', label: 'Tooltips', content: <TooltipsTab /> },
          { id: 'typography', label: 'Typography', content: <TypographyTab /> },
        ]}
      />
    </Stack>
  );
}
