/**──────────────────────────────────────────────────────────────────────┐
│  🤖 INPUT VR - Export Hub                                              │
│  /src/vr/input/index.ts                                         │
│                                                                        │
│  Interactive form controls for data collection.                       │
│                                                                        │
│  TTT God Architecture:                                                 │
│  - Input.text: Standard text input                                    │
│  - Input.password: Password input with visibility toggle              │
│  - Input.textarea: Multi-line text input                              │
│  - Input.select: Dropdown selection                                   │
│  - Input.checkbox: Checkbox control                                   │
│  - Input.radio: Radio button control                                  │
│  - Input.toggle: Toggle switch                                        │
│  - Input.range: Range slider                                          │
└────────────────────────────────────────────────────────────────────────┘ */


import TextInput from '@/vr/input/text';
import PasswordInput from '@/vr/input/password';
import TextareaInput from '@/vr/input/textarea';
import SelectInput from '@/vr/input/select';
import { Checkbox } from '@/vr/input/checkbox';
import RadioInput from '@/vr/input/radio';
import RadioFancyInput from '@/vr/input/radio-fancy';
import ToggleInput from '@/vr/input/toggle';
import RangeInput from '@/vr/input/range';

export const Input = {
  text: TextInput,
  password: PasswordInput,
  textarea: TextareaInput,
  select: SelectInput,
  checkbox: Checkbox,
  radio: RadioInput,
  radioFancy: RadioFancyInput,
  toggle: ToggleInput,
  range: RangeInput,
};

export default Input;
