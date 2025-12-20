/**──────────────────────────────────────────────────────────────────────┐
│  🤖 TYPOGRAPHY VR COMPONENTS - Export Hub                             │
│  /src/vr/typography/index.ts                                   │
│                                                                        │
│  Central export for all Typography VR components.                     │
│                                                                        │
│  Usage:                                                                │
│    import { Typography, T } from '@/vr';                       │
│                                                                        │
│    <Typography.body>Full namespace</Typography.body>                  │
│    <T.body>Short alias</T.body>                                       │
│    <T.h2>Heading shortcut</T.h2>                                      │
└────────────────────────────────────────────────────────────────────────┘ */

import TypographyTitle from './TypographyTitle';
import TypographyHeading from './TypographyHeading';
import TypographyBody from './TypographyBody';
import TypographyCaption from './TypographyCaption';
import TypographyHero from './TypographyHero';
import type { TypographyHeadingProps } from './TypographyHeading';

// VR Namespace Export - Typography.title, Typography.heading, etc.
export const Typography = {
  hero: TypographyHero,
  title: TypographyTitle,
  heading: TypographyHeading,
  body: TypographyBody,
  caption: TypographyCaption,

  // Heading shortcuts - Pure Level System
  h2: (props: Omit<TypographyHeadingProps, 'level'>) =>
    TypographyHeading({ ...props, level: 2 }),
  h3: (props: Omit<TypographyHeadingProps, 'level'>) =>
    TypographyHeading({ ...props, level: 3 }),
  h4: (props: Omit<TypographyHeadingProps, 'level'>) =>
    TypographyHeading({ ...props, level: 4 }),
  h5: (props: Omit<TypographyHeadingProps, 'level'>) =>
    TypographyHeading({ ...props, level: 5 }),
  h6: (props: Omit<TypographyHeadingProps, 'level'>) =>
    TypographyHeading({ ...props, level: 6 }),
};

// Short alias - T.body, T.h2, etc.
export const T = Typography;

// Re-export types
export type { TypographyHeroProps } from './TypographyHero';
export type { TypographyTitleProps } from './TypographyTitle';
export type { TypographyHeadingProps } from './TypographyHeading';
export type { TypographyBodyProps } from './TypographyBody';
export type { TypographyCaptionProps } from './TypographyCaption';
