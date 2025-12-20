/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Toggle                                       │
│  /src/components/prebuilts/input/toggle/index.tsx                      │
│                                                                        │
│  Toggle switch with label and smooth animation.                       │
└────────────────────────────────────────────────────────────────────────┘ */

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
  /** Show on/off text */
  showText?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputToggle - Toggle switch component
 * TTT Gap Model compliant - no external margins
 */
export default function InputToggle({
  enabled,
  onChange,
  label,
  labelPosition = 'right',
  size = 'md',
  disabled = false,
  showText = false,
  className = ''
}: InputToggleProps) {
  const wrapperClasses = [
    'vr-input-toggle-wrapper',
    label && `vr-input-toggle-wrapper--${labelPosition}`,
    disabled && 'vr-input-toggle-wrapper--disabled',
    className
  ].filter(Boolean).join(' ');

  const toggleClasses = [
    'vr-input-toggle',
    `vr-input-toggle--${size}`,
    enabled && 'vr-input-toggle--enabled'
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (!disabled) {
      onChange(!enabled);
    }
  };

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={handleClick}
      disabled={disabled}
      className={toggleClasses}
    >
      <span className="vr-input-toggle-track">
        {showText && (
          <span className="vr-input-toggle-text">
            {enabled ? 'ON' : 'OFF'}
          </span>
        )}
        <span className="vr-input-toggle-thumb" />
      </span>
    </button>
  );

  if (!label) return toggle;

  return (
    <div className={wrapperClasses}>
      {labelPosition === 'left' && (
        <span className="vr-input-toggle-label">{label}</span>
      )}
      {toggle}
      {labelPosition === 'right' && (
        <span className="vr-input-toggle-label">{label}</span>
      )}
    </div>
  );
}
