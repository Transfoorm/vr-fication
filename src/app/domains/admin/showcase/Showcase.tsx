'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Tabs, Page } from '@/vr';
import Buttons from './_tabs/Buttons';
import Cards from './_tabs/Cards';
import Fields from './_tabs/Fields';
import Radios from './_tabs/Radios';
import VrGuide from './_tabs/VrGuide';
import Tooltips from './_tabs/Tooltips';
import Typography from './_tabs/Typography';
import FtGuide from './_tabs/FtGuide';

export default function Showcase() {
  useSetPageHeader('Showcase', 'Variant Robots (VR) - Discover the sites VR component registry');

  return (
    <Page.constrained>
      <Tabs.panels
        tabs={[
          { id: 'vr', label: 'VR Guide', content: <VrGuide /> },
          { id: 'ft', label: 'FT Guide', content: <FtGuide /> },
          { id: 'buttons', label: 'Buttons', content: <Buttons /> },
          { id: 'cards', label: 'Cards', content: <Cards /> },
          { id: 'fields', label: 'Fields', content: <Fields /> },
          { id: 'radios', label: 'Radios', content: <Radios /> },
          { id: 'tooltips', label: 'Tooltips', content: <Tooltips /> },
          { id: 'typography', label: 'Typography', content: <Typography /> },
        ]}
      />
    </Page.constrained>
  );
}
