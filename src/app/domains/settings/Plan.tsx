'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Plan() {
  useSetPageHeader('Plan', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Plan coming soon</T.body>
    </Page.constrained>
  );
}
