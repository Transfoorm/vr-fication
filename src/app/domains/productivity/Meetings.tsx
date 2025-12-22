'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Meetings() {
  useSetPageHeader('Meetings', 'Coming soon');
  return (
    <Page.full>
      <T.body>Meetings coming soon</T.body>
    </Page.full>
  );
}
