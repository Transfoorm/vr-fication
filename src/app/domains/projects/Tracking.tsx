'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function Tracking() {
  useSetPageHeader('Project Tracking', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Project Tracking coming soon</T.body>
    </Page.constrained>
  );
}
