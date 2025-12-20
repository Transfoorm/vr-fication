/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Field.readonly                                    │
│  /src/prebuilts/field/Readonly.tsx                                    │
│                                                                        │
│  Read-only field with label + content + messages.                     │
│  Use Field.live for editable, Field.verify for verification-required. │
└────────────────────────────────────────────────────────────────────────┘ */

export interface FieldReadonlyProps {
  /** Field content */
  children: React.ReactNode;
  /** Field label */
  label?: string;
  /** Required indicator */
  required?: boolean;
  /** Helper text */
  helper?: string;
  /** Error message */
  error?: string;
}

export default function FieldReadonly({
  children,
  label,
  required = false,
  helper,
  error,
}: FieldReadonlyProps) {
  const classes = [
    'vr-field-readonly',
    error && 'vr-field-readonly--error',
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="vr-field-readonly__label">
          {label}
          {required && <span className="vr-field-readonly__required">*</span>}
        </label>
      )}
      {children}
      {helper && !error && (
        <div className="vr-field-readonly__helper">{helper}</div>
      )}
      {error && <div className="vr-field-readonly__error">{error}</div>}
    </div>
  );
}
