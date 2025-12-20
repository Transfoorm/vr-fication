/**──────────────────────────────────────────────────────────────────────┐
│  ☑️ VARIANT ROBOT - Checkbox Table                                    │
│  /src/prebuilts/input/checkbox/table/index.tsx                        │
│                                                                        │
│  Accessible checkbox for table row selection.                         │
│  Handles checked, indeterminate, and disabled states.                 │
└────────────────────────────────────────────────────────────────────────┘ */

export interface TableCheckboxProps {
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

/**
 * TableCheckbox - Checkbox for table row selection
 *
 * Features:
 * - Accessible with proper input element
 * - Supports checked, indeterminate, and disabled states
 * - Size variants (xs, sm, md, lg)
 * - Hover and focus states
 *
 * Usage:
 * ```tsx
 * <Checkbox.table
 *   checked={isChecked}
 *   onChange={handleToggle}
 *   disabled={isSelf}
 *   ariaLabel="Select user"
 * />
 * ```
 */
export default function TableCheckbox({
  checked,
  onChange,
  disabled = false,
  indeterminate = false,
  size = 'sm',
  ariaLabel
}: TableCheckboxProps) {
  const classes = [
    'vr-input-checkbox-table',
    `vr-input-checkbox-table--${size}`,
    checked && 'vr-input-checkbox-table--checked',
    indeterminate && 'vr-input-checkbox-table--indeterminate',
    disabled && 'vr-input-checkbox-table--disabled'
  ].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={classes}
    >
      {(checked || indeterminate) && (
        <span className="vr-input-checkbox-table__icon" aria-hidden="true">
          {indeterminate ? '−' : '✓'}
        </span>
      )}
    </button>
  );
}
