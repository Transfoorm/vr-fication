'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Plans() {
  useSetPageHeader('Plans', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Plans coming soon</T.body>
    </Page.constrained>
  );
}
