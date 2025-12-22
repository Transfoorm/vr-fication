'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function AI() {
  useSetPageHeader('AI', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>AI coming soon</T.body>
    </Page.constrained>
  );
}
