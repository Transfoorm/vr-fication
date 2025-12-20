/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Rank Selector                                     │
│  /src/prebuilts/rank/Selector.tsx                                     │
│                                                                        │
│  Rank-specific dropdown - thin composition layer over Dropdown.withIcons │
│                                                                        │
│  TRUE VR COMPOSITION:                                                  │
│  - Converts RANK_METADATA to dropdown options                         │
│  - Passes to generic Dropdown.withIcons VR                            │
│  - Zero duplicate logic!                                              │
│                                                                        │
│  Usage:                                                                │
│  <RankSelector                                                         │
│    value="captain"                                                     │
│    onChange={(rank) => handleChange(rank)}                            │
│    disabled={false}                                                    │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { RANK_METADATA, type Rank } from '@/fuse/constants/ranks';
import { Dropdown } from '@/prebuilts/dropdown';
import type { DropdownOption } from '@/prebuilts/dropdown/DropdownWithIcons';

export interface RankSelectorProps {
  value: Rank;
  onChange: (rank: Rank) => void;
  disabled?: boolean;
}

/**
 * RankSelector - Rank-specific dropdown composition
 *
 * TRUE VR ARCHITECTURE:
 * - Composes generic Dropdown.withIcons VR
 * - Converts RANK_METADATA to dropdown options format
 * - Zero dropdown logic - all handled by Dropdown.withIcons
 * - This is just a data adapter!
 */
export default function RankSelector({ value, onChange, disabled = false }: RankSelectorProps) {
  // Convert RANK_METADATA to dropdown options format
  const ranks: Rank[] = ['admiral', 'commodore', 'captain', 'crew'];
  const options: DropdownOption[] = ranks.map(rank => ({
    value: rank,
    label: RANK_METADATA[rank].label,
    icon: RANK_METADATA[rank].icon,
  }));

  return (
    <Dropdown.withIcons
      options={options}
      value={value}
      onChange={(val) => onChange(val as Rank)}
      disabled={disabled}
    />
  );
}
