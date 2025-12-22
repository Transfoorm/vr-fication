'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Invoices() {
  useSetPageHeader('Invoices', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Invoices coming soon</T.body>
    </Page.constrained>
  );
}
