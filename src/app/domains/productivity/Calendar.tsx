'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Calendar() {
  useSetPageHeader('Calendar', 'Coming soon');
  return (
    <Page.full>
      <T.body>Calendar coming soon</T.body>
    </Page.full>
  );
}
