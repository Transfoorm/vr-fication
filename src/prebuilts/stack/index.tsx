/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Stack Component Registry                           │
│  /src/prebuilts/stack/index.tsx                                       │
│                                                                        │
│  DEPRECATED: Stack variants removed as dead code.                     │
│  This file kept for backward compatibility.                           │
│                                                                        │
│  Migration: Use flex/grid layouts directly in your components.        │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

interface StackProps {
  children: ReactNode;
  className?: string;
}

// Stub component for backward compatibility
const StackVertical = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack ${className}`}>
    {children}
  </div>
);

const StackTight = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-tight ${className}`}>
    {children}
  </div>
);

const StackLoose = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-loose ${className}`}>
    {children}
  </div>
);

const StackHorizontal = ({ children, className = '' }: StackProps) => (
  <div className={`vr-stack-horizontal ${className}`}>
    {children}
  </div>
);

export const Stack = Object.assign(StackVertical, {
  tight: StackTight,
  loose: StackLoose,
  horizontal: StackHorizontal,
});

export { StackVertical, StackTight, StackLoose, StackHorizontal };

export type StackVerticalProps = StackProps;
export type StackTightProps = StackProps;
export type StackLooseProps = StackProps;
export type StackHorizontalProps = StackProps;
