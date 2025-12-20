/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Range                                        │
│  /src/components/prebuilts/input/range/index.tsx                       │
│                                                                        │
│  Range slider input with value display and custom styling.            │
└────────────────────────────────────────────────────────────────────────┘ */

import { useMemo } from 'react';

export interface InputRangeProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Show value label */
  showValue?: boolean;
  /** Value label position */
  valuePosition?: 'top' | 'right' | 'tooltip';
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Label text */
  label?: string;
  /** Unit suffix (e.g., "px", "%") */
  unit?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputRange - Range slider input
 * TTT Gap Model compliant - no external margins
 */
export default function InputRange({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  valuePosition = 'right',
  showMinMax = false,
  label,
  unit = '',
  disabled = false,
  className = ''
}: InputRangeProps) {
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100;
  }, [value, min, max]);

  const classes = [
    'vr-input-range',
    showValue && `vr-input-range--value-${valuePosition}`,
    disabled && 'vr-input-range--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && <span className="vr-input-range-label">{label}</span>}

      <div className="vr-input-range-container">
        {showMinMax && (
          <span className="vr-input-range-min">{min}</span>
        )}

        <div className="vr-input-range-track-wrapper">
          <input
            type="range"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className="vr-input-range-input"
            // Dynamic Law: Slider gradient updates based on runtime value
            style={{
              background: `linear-gradient(to right, var(--brand-primary) 0%, var(--brand-primary) ${percentage}%, var(--gray-300) ${percentage}%, var(--gray-300) 100%)`
            }}
          />

          {showValue && valuePosition === 'tooltip' && (
            <span
              className="vr-input-range-tooltip"
              // Dynamic Law: Tooltip position follows slider value
              style={{ left: `${percentage}%` }}
            >
              {value}{unit}
            </span>
          )}
        </div>

        {showMinMax && (
          <span className="vr-input-range-max">{max}</span>
        )}

        {showValue && valuePosition === 'right' && (
          <span className="vr-input-range-value">
            {value}{unit}
          </span>
        )}
      </div>

      {showValue && valuePosition === 'top' && (
        <span className="vr-input-range-value-top">
          {value}{unit}
        </span>
      )}
    </div>
  );
}
