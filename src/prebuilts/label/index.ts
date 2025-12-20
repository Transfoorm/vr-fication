/**──────────────────────────────────────────────────────────────────────┐
│  🤖 LABEL VR - Export Hub                                              │
│  /src/prebuilts/label/index.ts                                         │
│                                                                        │
│  Text decorations and messaging for form fields.                      │
│                                                                        │
│  TTT God Architecture:                                                 │
│  - Label.basic: Field label text                                      │
│  - Label.error: Error message                                         │
│  - Label.hint: Helper hint text                                       │
│  - Label.success: Success message                                     │
│  - Label.warning: Warning message                                     │
└────────────────────────────────────────────────────────────────────────┘ */

import LabelBasic from './LabelBasic';
import ErrorLabel from './LabelError';
import HintLabel from './LabelHint';
import SuccessLabel from './LabelSuccess';
import WarningLabel from './LabelWarning';

export const Label = {
  basic: LabelBasic,
  error: ErrorLabel,
  hint: HintLabel,
  success: SuccessLabel,
  warning: WarningLabel,
};

export default Label;
