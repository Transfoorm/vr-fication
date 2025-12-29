'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Billing() {
  useSetPageHeader('Billing', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Billing coming soon</T.body>
    </Page.constrained>
  );
}
