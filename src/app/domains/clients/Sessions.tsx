'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Sessions() {
  useSetPageHeader('Sessions', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Sessions coming soon</T.body>
    </Page.constrained>
  );
}
