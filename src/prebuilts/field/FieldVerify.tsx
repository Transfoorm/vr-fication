/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Field.verify                                       │
│  /src/prebuilts/field/Verify.tsx                                       │
│                                                                        │
│  DUMB VR - Pure visual shell, NO FUSE.                                │
│  Receives value, fires onCommit callback. That's it.                  │
│                                                                        │
│  The Reveal Pattern:                                                   │
│  - idle: Display mode (no border, quiet)                              │
│  - focused: Awakens (border materializes, yellow breathes in)         │
│  - dirty: Pill slides in showing → newValue                           │
│  - committing: Pill becomes spinner, amber pulse                       │
│  - success: Green ring, checkmark, fades to idle                      │
│  - error: Red ring, error message, stays focused                      │
│                                                                        │
│  Blur without clicking pill = revert (safe escape)                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

type VerifyState = 'idle' | 'focused' | 'dirty' | 'committing' | 'success' | 'error';

export interface FieldVerifyProps {
  /** Current value */
  value: string;
  /** Called when user clicks the commit pill */
  onCommit: (newValue: string) => Promise<void>;
  /** Field label */
  label: string;
  /** Input type */
  type?: 'text' | 'email' | 'tel';
  /** Placeholder when empty */
  placeholder?: string;
  /** Required indicator */
  required?: boolean;
  /** Helper text */
  helper?: string;
  /** Only show helper when focused (not in idle state) */
  helperOnFocus?: boolean;
  /** Pill intent variant: verify (default), send */
  variant?: 'verify' | 'send';
}

export default function FieldVerify({
  value,
  onCommit,
  label,
  type = 'text',
  placeholder = '',
  required = false,
  helper,
  helperOnFocus = false,
  variant = 'verify',
}: FieldVerifyProps) {
  const [state, setState] = useState<VerifyState>('idle');
  const [localValue, setLocalValue] = useState(value);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const originalValue = useRef(value);
  const isCommitting = useRef(false);

  // Sync local value when external value changes
  useEffect(() => {
    if (state === 'idle' || state === 'success') {
      setLocalValue(value);
      originalValue.current = value;
    }
  }, [value, state]);

  // ─────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    if (state === 'idle') {
      setState('focused');
      setErrorMessage(null);
    }
    // Select all text on focus
    e.target.select();
  }, [state]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // Only go dirty if value actually changed from original
    if (newValue !== originalValue.current) {
      setState('dirty');
    } else {
      setState('focused');
    }
  }, []);

  const handleBlur = useCallback(() => {
    // Don't revert if we're in the middle of committing
    if (isCommitting.current) return;

    // Use setTimeout to allow pill click to register before reverting
    setTimeout(() => {
      // Check again after timeout - if pill was clicked, isCommitting will be true
      if (isCommitting.current) return;

      // Revert to original and go idle (works for all states including error)
      setLocalValue(originalValue.current);
      setState('idle');
      setErrorMessage(null);
    }, 150);
  }, []);

  const handlePillClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If in error state, clicking button (Invalid/Cancelled) resets to original and returns to editing
    if (state === 'error') {
      // Reset everything to clean state
      const resetValue = originalValue.current;
      setLocalValue(resetValue);
      setErrorMessage(null);
      setState('focused');

      // Focus and select for immediate retry
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return;
    }

    // Validate email format if type is email
    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(localValue)) {
        setState('error');
        setErrorMessage('Please enter a valid email address');
        return;
      }
    }

    // Prevent blur from reverting
    isCommitting.current = true;
    setState('committing');

    try {
      // CALLBACK MODE: Let parent handle it
      await onCommit(localValue);

      setState('success');
      originalValue.current = localValue;

      // Return to idle after success lingers
      setTimeout(() => {
        setState('idle');
        isCommitting.current = false;
      }, 1500);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save';

      // If verification was deliberately cancelled by user, treat as silent abandon (not error)
      if (errorMsg.toLowerCase().includes('cancel')) {
        // Silently reset to original and go idle (clean abandon)
        setLocalValue(originalValue.current);
        setState('idle');
        setErrorMessage(null);
        isCommitting.current = false;
        return;
      }

      // Actual errors stay in error state for retry
      setState('error');
      setErrorMessage(errorMsg);
      isCommitting.current = false;
      // Stay focused so user can retry or blur to revert
    }
  }, [localValue, type, state, onCommit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Revert and blur
      setLocalValue(originalValue.current);
      setState('idle');
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && state === 'dirty') {
      // Commit on Enter when dirty
      handlePillClick(e as unknown as React.MouseEvent);
    }
  }, [state, handlePillClick]);

  // ─────────────────────────────────────────────────────────────────────
  // Derived state
  // ─────────────────────────────────────────────────────────────────────

  const isDirty = localValue !== originalValue.current;
  const isEmpty = !value; // Original value is empty (no verified value yet)

  // Pill content based on state
  const getPillContent = () => {
    if (state === 'committing') {
      return <span className="vr-field-verify__typing">Verifying...</span>;
    }
    if (state === 'error') {
      // Show "Cancelled" if verification was cancelled, otherwise "Invalid"
      const isCancelled = errorMessage?.toLowerCase().includes('cancel');
      return isCancelled ? 'Cancelled' : 'Invalid';
    }
    if (isDirty) {
      return variant === 'send' ? 'Send →' : 'Verify →';
    }
    if (state === 'focused') {
      return <span className="vr-field-verify__typing">Editing...</span>;
    }
    // Empty value = not set yet, show neutral state
    if (isEmpty) {
      return 'Not Set';
    }
    return 'Verified ✓';
  };

  // ─────────────────────────────────────────────────────────────────────
  // Classes
  // ─────────────────────────────────────────────────────────────────────

  const wrapperClasses = [
    'vr-field-verify',
    `vr-field-verify--${state}`,
    helper && 'vr-field--has-helper',
  ].filter(Boolean).join(' ');

  // Pill state: active (dirty/committing) > editing (focused) > empty (not set) > verified (idle)
  const getPillState = () => {
    if (state === 'committing') return 'vr-field-verify__pill--active';  // Stay orange while verifying
    if (isDirty) return 'vr-field-verify__pill--active';
    if (state === 'focused') return 'vr-field-verify__pill--editing';
    if (isEmpty) return 'vr-field-verify__pill--empty';  // Neutral gray for empty/not set
    return 'vr-field-verify__pill--verified';
  };

  const pillClasses = [
    'vr-field-verify__pill',
    getPillState(),
    state === 'error' && 'vr-field-verify__pill--error',
  ].filter(Boolean).join(' ');

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className={wrapperClasses}>
      <label className="vr-field__label">
        {label}
        {required && <span className="vr-field__required">*</span>}
      </label>

      <div className="vr-field-verify__input-wrapper">
        <input
          ref={inputRef}
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="vr-field-verify__input"
          aria-describedby={errorMessage ? 'verify-error' : undefined}
        />

        <button
          type="button"
          className={pillClasses}
          onClick={handlePillClick}
          onMouseDown={(e) => e.preventDefault()}
          disabled={state === 'committing' || state === 'success'}
          tabIndex={-1}
          aria-label={state === 'dirty' ? `Confirm change to ${localValue}` : undefined}
        >
          {getPillContent()}
        </button>
      </div>

      {helper && state !== 'error' && (!helperOnFocus || state !== 'idle') && (
        <div className="vr-field__helper">{helper}</div>
      )}

      {errorMessage && state === 'error' && !errorMessage.toLowerCase().includes('cancel') && (
        <div id="verify-error" className="vr-field__error" role="alert">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
