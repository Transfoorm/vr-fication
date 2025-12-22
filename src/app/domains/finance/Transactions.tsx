'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Transactions() {
  useSetPageHeader('Transactions', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Transactions coming soon</T.body>
    </Page.constrained>
  );
}
