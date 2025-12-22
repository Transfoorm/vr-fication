'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Payments() {
  useSetPageHeader('Payments', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Payments coming soon</T.body>
    </Page.constrained>
  );
}
