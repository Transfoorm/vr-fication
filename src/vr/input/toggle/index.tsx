/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Toggle                                       │
│  /src/vr/input/toggle/index.tsx                                        │
│                                                                        │
│  Toggle switch with label and smooth animation.                        │
│  Uses native checkbox input for accessibility.                         │
└────────────────────────────────────────────────────────────────────────┘ */

import { useId } from 'react';

export interface InputToggleProps {
  /** Current toggle state */
  enabled: boolean;
  /** Change handler */
  onChange: (enabled: boolean) => void;
  /** Label text */
  label?: string;
  /** Label position */
  labelPosition?: 'left' | 'right';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputToggle - Toggle switch component
 * Uses native checkbox for accessibility
 */
export default function InputToggle({
  enabled,
  onChange,
  label,
  labelPosition = 'right',
  size = 'md',
  disabled = false,
  className = ''
}: InputToggleProps) {
  const id = useId();

  const wrapperClasses = [
    'vr-input-toggle-wrapper',
    label && `vr-input-toggle-wrapper--${labelPosition}`,
    size !== 'md' && `vr-input-toggle-wrapper--${size}`,
    disabled && 'vr-input-toggle-wrapper--disabled',
    className
  ].filter(Boolean).join(' ');

  const toggleClasses = [
    'vr-input-toggle',
    size !== 'md' && `vr-input-toggle--${size}`,
    disabled && 'vr-input-toggle--disabled'
  ].filter(Boolean).join(' ');

  const handleChange = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const toggle = (
    <div className={toggleClasses}>
      <input
        type="checkbox"
        id={id}
        checked={enabled}
        onChange={handleChange}
        disabled={disabled}
        className="vr-input-toggle-checkbox"
      />
      <label
        htmlFor={id}
        className="vr-input-toggle-track"
        aria-label={label || 'Toggle'}
      />
    </div>
  );

  if (!label) return toggle;

  return (
    <div className={wrapperClasses}>
      {labelPosition === 'left' && (
        <label htmlFor={id} className="vr-input-toggle-label">{label}</label>
      )}
      {toggle}
      {labelPosition === 'right' && (
        <label htmlFor={id} className="vr-input-toggle-label">{label}</label>
      )}
    </div>
  );
}
