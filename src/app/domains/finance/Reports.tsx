'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page, T } from '@/vr';

export default function FinanceReports() {
  useSetPageHeader('Reports', 'Coming soon');
  return (
    <Page.constrained>
      <T.body>Finance Reports coming soon</T.body>
    </Page.constrained>
  );
}
