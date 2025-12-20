/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Password                                     │
│  /src/vr/input/password/index.tsx                    │
│                                                                        │
│  Password input with visibility toggle.                               │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState } from 'react';
import { Icon } from '@/vr';

export interface InputPasswordProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputPassword - Password input with visibility toggle
 * TTT Gap Model compliant - no external margins
 */
export default function InputPassword({
  value,
  onChange,
  placeholder = 'Enter password',
  autoFocus = false,
  disabled = false,
  className = ''
}: InputPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`vr-input-password-wrapper ${className}`}>
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        className="vr-input-password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="vr-input-password-toggle"
        tabIndex={-1}
      >
        <Icon variant={showPassword ? 'eye-off' : 'eye'} size="sm" />
      </button>
    </div>
  );
}
