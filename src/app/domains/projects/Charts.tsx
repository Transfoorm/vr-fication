'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page } from '@/vr';

export default function Charts() {
  useSetPageHeader('Charts', 'Coming soon');
  return (
    <Page.constrained>
      {/* Coming soon */}
    </Page.constrained>
  );
}
