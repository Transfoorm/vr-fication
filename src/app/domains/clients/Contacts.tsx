'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Contacts() {
  useSetPageHeader('Contacts', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Contacts coming soon</T.body>
    </Page.constrained>
  );
}
