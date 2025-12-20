/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Full Page                                          │
│  /src/components/prebuilts/page/full/index.tsx                         │
│                                                                        │
│  Edge-to-edge immersive layout. Zero padding. Maximum impact.         │
│                                                                        │
│  Usage:                                                                │
│  import { Page } from '@/prebuilts/page';                  │
│  <Page.full>                                                          │
│    <HeroSection />                                                    │
│    <VideoPlayer />                                                    │
│  </Page.full>                                                         │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

export interface FullPageProps {
  children: ReactNode;
  className?: string;
}

/**
 * FullPage - Full bleed immersive layout
 *
 * Features:
 * - Zero padding - content touches all edges
 * - Full viewport utilization
 * - Perfect for immersive experiences
 * - No content constraints
 *
 * Perfect for:
 * - Landing pages
 * - Hero sections
 * - Full-screen galleries
 * - Video backgrounds
 * - Immersive data visualizations
 * - Marketing splash screens
 */
export default function FullPage({
  children,
  className = ''
}: FullPageProps) {
  return (
    <div className={`vr-page vr-page-full ${className}`}>
      {children}
    </div>
  );
}