/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Radio                                        │
│  /src/vr/input/radio/index.tsx                       │
│                                                                        │
│  Radio button group with consistent styling.                          │
└────────────────────────────────────────────────────────────────────────┘ */

import { useId } from 'react';
import { Tooltip } from '@/vr/tooltip';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  tooltip?: string;
  tooltipSize?: 'sm' | 'md' | 'lg';
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right';
}

export interface InputRadioProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Options array */
  options: RadioOption[];
  /** Unique name for the radio group (auto-generated if not provided) */
  name?: string;
  /** Layout direction */
  direction?: 'vertical' | 'horizontal';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Font weight */
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  /** Disabled state for entire group */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputRadio - Radio button group
 * TTT Gap Model compliant - no external margins
 */
export default function InputRadio({
  value,
  onChange,
  options,
  name,
  direction = 'vertical',
  size = 'md',
  weight,
  disabled = false,
  className = ''
}: InputRadioProps) {
  const autoId = useId();
  const groupName = name || `radio-group-${autoId}`;

  const groupClasses = [
    'vr-input-radio-group',
    `vr-input-radio-group--${direction}`,
    className
  ].filter(Boolean).join(' ');

  const itemClasses = [
    'vr-input-radio',
    `vr-input-radio--${size}`,
    weight && `vr-input-radio--weight-${weight}`,
    disabled && 'vr-input-radio--disabled'
  ].filter(Boolean).join(' ');

  return (
    <div className={groupClasses} role="radiogroup">
      {options.map((option) => {
        const radioElement = (
          <label
            key={option.value}
            className={`${itemClasses} ${option.disabled ? 'vr-input-radio--disabled' : ''}`}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled || option.disabled}
              className="vr-input-radio-input"
            />
            <span className="vr-input-radio-button">
              <span className="vr-input-radio-dot" />
            </span>
            <span className="vr-input-radio-label">
              {option.label}
              {option.description && (
                <span className="vr-input-radio-desc">{option.description}</span>
              )}
            </span>
          </label>
        );

        if (option.tooltip) {
          return (
            <Tooltip.caret
              key={option.value}
              content={option.tooltip}
              size={option.tooltipSize || 'sm'}
              side={option.tooltipSide || 'top'}
            >
              {radioElement}
            </Tooltip.caret>
          );
        }

        return radioElement;
      })}
    </div>
  );
}
