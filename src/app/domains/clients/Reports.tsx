'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Reports() {
  useSetPageHeader('Reports', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Client Reports coming soon</T.body>
    </Page.constrained>
  );
}
