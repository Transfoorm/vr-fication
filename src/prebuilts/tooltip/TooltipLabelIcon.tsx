/**──────────────────────────────────────────────────────────────────────┐
│  💬 TOOLTIP LABEL ICON VARIANT - Info Icon for Labels                │
│  /src/prebuilts/tooltip/TooltipLabelIcon.tsx                          │
│                                                                        │
│  Renders an info icon with tooltip for use next to field labels.      │
│  Consistent positioning and styling.                                   │
│                                                                        │
│  Usage:                                                                │
│  import { Tooltip } from '@/prebuilts/tooltip';                       │
│  <label className="vr-field__label">                                  │
│    Username                                                            │
│    <Tooltip.labelIcon content="Enter your username here" />           │
│  </label>                                                              │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { Icon } from '@/prebuilts';
import Tooltip from './Tooltip';
import './tooltip.css';

interface TooltipLabelIconProps {
  content: string;
  size?: 'sm' | 'md' | 'lg';
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export default function TooltipLabelIcon({ content, size = 'sm', side = 'top' }: TooltipLabelIconProps) {
  return (
    <Tooltip content={content} size={size} side={side} trigger="click" closeOnMouseLeave={true}>
      <span className="vr-tooltip-label-icon">
        <Icon variant="info" size="xs" className="vr-tooltip-label-icon__icon" />
      </span>
    </Tooltip>
  );
}
