'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Teams() {
  useSetPageHeader('Teams', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Teams coming soon</T.body>
    </Page.constrained>
  );
}
