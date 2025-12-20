/**──────────────────────────────────────────────────────────────────────┐
│  🤖 DROPDOWN VR - Barrel Export                                       │
│  /src/components/prebuilts/dropdown/index.tsx                         │
│                                                                        │
│  Complete dropdown system - 4 variants for all use cases.             │
│                                                                        │
│  Usage:                                                                │
│  import { Dropdown } from '@/prebuilts';                   │
│                                                                        │
│  <Dropdown.simple options={...} value={...} />                        │
│  <Dropdown.withIcons options={...} value={...} />                     │
│  <Dropdown.withAvatars options={...} value={...} />                   │
│  <Dropdown.multiSelect options={...} value={[...]} />                 │
└────────────────────────────────────────────────────────────────────────┘ */

import DropdownSimple from './Simple';
import DropdownWithIcons from './DropdownWithIcons';
import DropdownWithAvatars from './AvatarDropdown';
import DropdownMultiSelect from './MultiSelect';

export const Dropdown = {
  simple: DropdownSimple,
  withIcons: DropdownWithIcons,
  withAvatars: DropdownWithAvatars,
  multiSelect: DropdownMultiSelect,
};

export default Dropdown;
