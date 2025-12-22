'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Overview() {
  useSetPageHeader('Financial Overview', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Financial Overview coming soon</T.body>
    </Page.constrained>
  );
}
