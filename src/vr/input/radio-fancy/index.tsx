/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Radio Fancy                                  │
│  /src/vr/input/radio-fancy/index.tsx                            │
│                                                                        │
│  Stylized radio button group with Uiverse-inspired design.            │
│  Features bold uppercase labels with descriptions.                     │
└────────────────────────────────────────────────────────────────────────┘ */

import { useId } from 'react';

export interface RadioFancyOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface InputRadioFancyProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options array */
  options: RadioFancyOption[];
  /** Unique name for the radio group (auto-generated if not provided) */
  name?: string;
  /** Disabled state for entire group */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputRadioFancy - Stylized radio button group
 * Uiverse-inspired design with bold labels and descriptions
 * TTT Gap Model compliant - no external margins
 */
export default function InputRadioFancy({
  value,
  onChange,
  options,
  name,
  disabled = false,
  className = ''
}: InputRadioFancyProps) {
  const autoId = useId();
  const groupName = name || `radio-fancy-${autoId}`;

  return (
    <div className={`vr-radio-fancy-group ${className}`} role="radiogroup">
      {options.map((option) => {
        const optionId = `${groupName}-${option.value}`;
        const isDisabled = disabled || option.disabled;

        return (
          <div key={option.value} className="vr-radio-fancy-row">
            <input
              type="radio"
              id={optionId}
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={isDisabled}
              className="vr-radio-fancy-input"
            />
            <label htmlFor={optionId} className={`vr-radio-fancy-button ${isDisabled ? 'vr-radio-fancy-button--disabled' : ''}`}>
              <span className="vr-radio-fancy-circle" />
            </label>
            <label htmlFor={optionId} className={`vr-radio-fancy-label ${isDisabled ? 'vr-radio-fancy-label--disabled' : ''}`}>
              <strong>{option.label}</strong>{option.description ? ` • ${option.description}` : ''}
            </label>
          </div>
        );
      })}
    </div>
  );
}
