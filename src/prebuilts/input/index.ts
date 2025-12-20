/**──────────────────────────────────────────────────────────────────────┐
│  🤖 INPUT VR - Export Hub                                              │
│  /src/prebuilts/input/index.ts                                         │
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


import TextInput from '@/prebuilts/input/text';
import PasswordInput from '@/prebuilts/input/password';
import TextareaInput from '@/prebuilts/input/textarea';
import SelectInput from '@/prebuilts/input/select';
import { Checkbox } from '@/prebuilts/input/checkbox';
import RadioInput from '@/prebuilts/input/radio';
import RadioFancyInput from '@/prebuilts/input/radio-fancy';
import ToggleInput from '@/prebuilts/input/toggle';
import RangeInput from '@/prebuilts/input/range';

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
