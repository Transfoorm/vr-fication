/**──────────────────────────────────────────────────────────────────────┐
│  🤖 SPINNER VR - Loading Indicator                                    │
│  /src/prebuilts/icon/Spinner.tsx                                      │
│                                                                        │
│  CSS border-based spinner (no SVG) - perfect centering.               │
│                                                                        │
│  Usage:                                                                │
│  import { Spinner } from '@/prebuilts';                                │
│  <Spinner size="md" color="brand" />                                  │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import './icon.css';

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type SpinnerColor = 'brand' | 'white' | 'inherit';

interface SpinnerProps {
  /** Size variant (matches Icon sizes) */
  size?: SpinnerSize;
  /** Color variant */
  color?: SpinnerColor;
  /** Optional className for layout context */
  className?: string;
}

/**
 * Spinner - CSS border-based loading indicator
 *
 * Features:
 * - CSS border trick (no SVG, perfect centering)
 * - 5 size variants matching Icon pattern
 * - 3 color variants for different contexts
 * - Accessible with role="status" and aria-label
 *
 * VR Compliance:
 * - Self-styled, no external CSS needed
 * - Size/color controlled by variants, not arbitrary props
 * - Works immediately when imported
 */
export function Spinner({
  size = 'md',
  color = 'brand',
  className = ''
}: SpinnerProps) {
  return (
    <div
      className={`vr-spinner vr-spinner--${size} vr-spinner--${color} ${className}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );
}
