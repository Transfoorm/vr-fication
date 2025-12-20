/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Text                                         │
│  /src/prebuilts/input/text/index.tsx                                   │
│                                                                        │
│  Standard text input field with consistent styling.                   │
└────────────────────────────────────────────────────────────────────────┘ */

export interface InputTextProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Focus handler - TTT-LiveField pattern: signals field entered */
  onFocus?: () => void;
  /** Blur handler - TTT-LiveField pattern: triggers save on field exit */
  onBlur?: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'tel' | 'number' | 'url';
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputText - Standard text input
 * TTT Gap Model compliant - no external margins
 */
export default function InputText({
  value,
  onChange,
  onFocus,
  onBlur,
  placeholder = '',
  type = 'text',
  autoFocus = false,
  disabled = false,
  className = ''
}: InputTextProps) {
  const classes = [
    'vr-input-text',
    disabled && 'vr-input-text--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => {
        e.target.select();
        onFocus?.();
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={classes}
    />
  );
}
