'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Locations() {
  useSetPageHeader('Locations', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Locations coming soon</T.body>
    </Page.constrained>
  );
}
