'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Ranks() {
  useSetPageHeader('Ranks', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Ranks coming soon</T.body>
    </Page.constrained>
  );
}
