'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Bookings() {
  useSetPageHeader('Bookings', 'Coming soon');
  return (
    <Page.full>
      <T.body>Coming soon</T.body>
    </Page.full>
  );
}
