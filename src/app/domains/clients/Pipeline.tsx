'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Pipeline() {
  useSetPageHeader('Pipeline', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Pipeline coming soon</T.body>
    </Page.constrained>
  );
}
