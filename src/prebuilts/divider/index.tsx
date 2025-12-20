/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Divider Component Registry                         │
│  /src/components/prebuilts/divider/index.tsx                          │
│                                                                        │
│  DEPRECATED: Divider variants removed as dead code.                   │
│  This file kept for backward compatibility.                           │
│                                                                        │
│  Migration: Use <hr /> or margin/padding for spacing.                 │
└────────────────────────────────────────────────────────────────────────┘ */


export type DividerSize = 'sm' | 'md' | 'lg' | 'xl';
export type DividerColor = string;
export type DividerWidth = string;

interface DividerProps {
  size?: DividerSize;
  className?: string;
}

// Stub components for backward compatibility
const DefaultDivider = ({ size = 'md', className = '' }: DividerProps) => {
  const sizeClass = size === 'md' ? '' : `vr-divider-default-${size}`;
  return <div className={`vr-divider-default ${sizeClass} ${className}`} />;
};

const LineDivider = ({ size = 'md', className = '' }: DividerProps) => {
  const sizeClass = size === 'md' ? '' : `vr-divider-line-${size}`;
  return <hr className={`vr-divider-line ${sizeClass} ${className}`} />;
};

const GradientDivider = ({ size = 'md', className = '' }: DividerProps) => {
  const sizeClass = size === 'md' ? '' : `vr-divider-gradient-${size}`;
  return <div className={`vr-divider-gradient ${sizeClass} ${className}`} />;
};

const DashedDivider = ({ size = 'md', className = '' }: DividerProps) => {
  const sizeClass = size === 'md' ? '' : `vr-divider-dashed-${size}`;
  return <hr className={`vr-divider-dashed ${sizeClass} ${className}`} />;
};

export const Divider = {
  default: DefaultDivider,
  line: LineDivider,
  gradient: GradientDivider,
  dashed: DashedDivider,
} as const;

export {
  DefaultDivider,
  LineDivider,
  GradientDivider,
  DashedDivider
};

export type DefaultDividerProps = DividerProps;
export type LineDividerProps = DividerProps;
export type GradientDividerProps = DividerProps;
export type DashedDividerProps = DividerProps;
