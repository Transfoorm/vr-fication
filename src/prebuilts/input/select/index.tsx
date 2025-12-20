/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Select                                       │
│  /src/components/prebuilts/input/select/index.tsx                      │
│                                                                        │
│  Dropdown select field with consistent styling.                       │
└────────────────────────────────────────────────────────────────────────┘ */

export interface SelectOption {
  value: string;
  label: string;
}

export interface InputSelectProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options array */
  options: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputSelect - Dropdown select field
 * TTT Gap Model compliant - no external margins
 */
export default function InputSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = ''
}: InputSelectProps) {
  const isEmpty = !value || value === '';

  const classes = [
    'vr-input-select',
    isEmpty && 'vr-input-select--empty',
    className
  ].filter(Boolean).join(' ');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={classes}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
