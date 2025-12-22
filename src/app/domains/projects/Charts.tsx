'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Charts() {
  useSetPageHeader('Charts', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Charts coming soon</T.body>
    </Page.constrained>
  );
}
