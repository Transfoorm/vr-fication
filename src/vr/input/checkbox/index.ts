/**──────────────────────────────────────────────────────────────────────┐
│  ☑️ CHECKBOX VR - Export Hub                                          │
│  /src/vr/input/checkbox/index.ts                               │
│                                                                        │
│  Checkbox controls for different contexts.                            │
│                                                                        │
│  Variants:                                                             │
│  - Checkbox.table: For table row selection (brand orange)             │
│  - Checkbox.form: For form inputs (TODO)                              │
│  - Checkbox.settings: For settings toggles (TODO)                     │
└────────────────────────────────────────────────────────────────────────┘ */

import TableCheckbox from '@/vr/input/checkbox/table';

export const Checkbox = {
  table: TableCheckbox,
  // form: FormCheckbox, // TODO: Implement form checkbox variant
  // settings: SettingsCheckbox, // TODO: Implement settings checkbox variant
};

export default Checkbox;
