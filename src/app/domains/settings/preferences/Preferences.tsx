/**──────────────────────────────────────────────────────────────────────┐
│  ⚙️ PREFERENCES - Sovereign Domain                                    │
│  /src/app/domains/settings/preferences/Preferences.tsx                │
│                                                                       │
│  FUSE 6.0: Pure client view that reads from FUSE store.               │
│  No server fetch. No RSC. Instant render.                             │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { usePageTiming } from '@/fuse/hooks/usePageTiming';
import { Tabs, Stack, Icon } from '@/prebuilts';
import MirorAI from './_tabs/MirorAI';
import Theme from './_tabs/Theme';
import Controls from './_tabs/Controls';

export default function Preferences() {
  useSetPageHeader('Preferences', 'Customize your experience');
  usePageTiming('/settings/preferences');

  return (
    <Stack>
      <Tabs.panels
        tabs={[
          { id: 'miror-ai', label: 'Miror AI', icon: <Icon variant="sparkles" />, content: <MirorAI /> },
          { id: 'theme', label: 'Theme', icon: <Icon variant="palette" />, content: <Theme /> },
          { id: 'controls', label: 'Controls', icon: <Icon variant="sliders" />, content: <Controls /> },
        ]}
      />
    </Stack>
  );
}
