/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ PREFERENCES PAGE FEATURE                                         │
│  /src/features/settings/preferences/index.tsx                         │
│                                                                       │
│  VR Doctrine: Feature Layer                                           │
│  - Owns Tabs.panels                                                   │
│  - Imports tab components from _tabs/                                 │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import './preferences-page.css';

import { Tabs, Stack, Icon } from '@/vr';
import { MirorAiTab } from './_tabs/MirorAiTab';
import { ThemeTab } from './_tabs/ThemeTab';
import { ControlsTab } from './_tabs/ControlsTab';
import { EmailTab } from './_tabs/EmailTab';

export function PreferencesPageFeature() {
  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'email', label: 'Email', icon: <Icon variant="mail" />, content: <EmailTab /> },
          { id: 'miror-ai', label: 'Miror AI', icon: <Icon variant="sparkles" />, content: <MirorAiTab /> },
          { id: 'theme', label: 'Theme', icon: <Icon variant="palette" />, content: <ThemeTab /> },
          { id: 'controls', label: 'Controls', icon: <Icon variant="sliders" />, content: <ControlsTab /> },
        ]}
      />
    </Stack>
  );
}
