/**──────────────────────────────────────────────────────────────────────┐
│  ☑️ CHECKBOX VR - Export Hub                                          │
│  /src/prebuilts/input/checkbox/index.ts                               │
│                                                                        │
│  Checkbox controls for different contexts.                            │
│                                                                        │
│  Variants:                                                             │
│  - Checkbox.table: For table row selection (brand orange)             │
│  - Checkbox.form: For form inputs (TODO)                              │
│  - Checkbox.settings: For settings toggles (TODO)                     │
└────────────────────────────────────────────────────────────────────────┘ */

import TableCheckbox from '@/prebuilts/input/checkbox/table';

export const Checkbox = {
  table: TableCheckbox,
  // form: FormCheckbox, // TODO: Implement form checkbox variant
  // settings: SettingsCheckbox, // TODO: Implement settings checkbox variant
};

export default Checkbox;
