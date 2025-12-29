'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Security() {
  useSetPageHeader('Security', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Security coming soon</T.body>
    </Page.constrained>
  );
}
