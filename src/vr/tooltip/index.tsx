/**──────────────────────────────────────────────────────────────────────┐
│  💬 TOOLTIP ROBOT - Barrel Export                                      │
│  /src/prebuilts/tooltip/index.tsx                                     │
│                                                                        │
│  Usage:                                                                │
│  import { Tooltip } from '@/vr';                                │
│  <Tooltip.caret content="Help text">...</Tooltip.caret>              │
│  <Tooltip.labelIcon content="Help text" />                            │
└────────────────────────────────────────────────────────────────────────┘ */

import TooltipMain from './Tooltip';
import TooltipLabelIcon from './TooltipLabelIcon';

export const Tooltip = {
  caret: TooltipMain,
  labelIcon: TooltipLabelIcon
};
