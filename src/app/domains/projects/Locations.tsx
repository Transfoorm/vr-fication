'use client';

import { useSetPageHeader } from '@/hooks/useSetPageHeader';
import { Page } from '@/vr';

export default function Locations() {
  useSetPageHeader('Locations', 'Coming soon');
  return (
    <Page.constrained>
      {/* Coming soon */}
    </Page.constrained>
  );
}
