'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page } from '@/vr';

export default function Teams() {
  useSetPageHeader('Teams', 'Coming soon');
  return (
    <Page.constrained>
      {/* Coming soon */}
    </Page.constrained>
  );
}
