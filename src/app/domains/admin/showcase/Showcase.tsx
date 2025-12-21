'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Tabs, Page } from '@/vr';
import Buttons from './_tabs/Buttons';
import Cards from './_tabs/Cards';
import Fields from './_tabs/Fields';
import Radios from './_tabs/Radios';
import Guide from './_tabs/Guide';
import Tooltips from './_tabs/Tooltips';
import Typography from './_tabs/Typography';
import Tab8 from './_tabs/Tab8';
import Tab9 from './_tabs/Tab9';
import Tab10 from './_tabs/Tab10';

export default function Showcase() {
  useSetPageHeader('Showcase', 'Variant Robots (VR) - Discover the sites VR component registry');

  return (
    <Page.constrained>
      <Tabs.panels
        tabs={[
          { id: 'guide', label: 'VR Guide', content: <Guide /> },
          { id: 'buttons', label: 'Buttons', content: <Buttons /> },
          { id: 'cards', label: 'Cards', content: <Cards /> },
          { id: 'fields', label: 'Fields', content: <Fields /> },
          { id: 'radios', label: 'Radios', content: <Radios /> },
          { id: 'tooltips', label: 'Tooltips', content: <Tooltips /> },
          { id: 'typography', label: 'Typography', content: <Typography /> },
          { id: 'tab8', label: 'Tab 8', content: <Tab8 /> },
          { id: 'tab9', label: 'Tab 9', content: <Tab9 /> },
          { id: 'tab10', label: 'Tab 10', content: <Tab10 /> },
        ]}
      />
    </Page.constrained>
  );
}
