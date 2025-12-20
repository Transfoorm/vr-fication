/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Field.live                                         │
│  /src/prebuilts/field/Live.tsx                                         │
│                                                                        │
│  TRULY LIVE auto-save field.                                           │
│                                                                        │
│  Flow:                                                                 │
│  1. Focus → faint yellow                                               │
│  2. Type → brighter yellow (dirty)                                     │
│  3. Pause 1000ms → fire DB (silent)                                    │
│  4. DB returns → "Saved ✓" appears (in or out of field)                │
│  5. 1.5s → badge fades → faint yellow if focused, idle if blurred      │
│  6. Blur while dirty → save immediately (speedster catch)              │
│                                                                        │
│  Domain view ONLY provides: label, value, onSave                       │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { T } from '@/prebuilts/typography';

// 🟨 DELAY FROM TYPING STOPPED TO DB SAVE
const SAVE_DELAY_MS = 500;

type LiveState = 'idle' | 'focused' | 'dirty' | 'saved' | 'error';

// ─────────────────────────────────────────────────────────────────────
// Built-in Transforms (VR-owned, not tab-level)
// ─────────────────────────────────────────────────────────────────────

/** Username: letters, numbers, and ONE dot (space converts to dot) */
const usernameTransform = (value: string, currentValue: string): string => {
  const currentHasDot = currentValue.includes('.');
  if (!currentHasDot && value.includes(' ')) {
    value = value.replace(' ', '.');
  }
  value = value.replace(/[^a-zA-Z0-9.]/g, '');
  const dotIndex = value.indexOf('.');
  if (dotIndex !== -1) {
    const beforeDot = value.substring(0, dotIndex + 1);
    const afterDot = value.substring(dotIndex + 1).replace(/\./g, '');
    value = beforeDot + afterDot;
  }
  return value;
};

/** Numbers only: strips everything except digits */
const numbersOnlyTransform = (value: string): string => {
  return value.replace(/[^0-9]/g, '');
};

/** Built-in transforms accessible by name */
export const TRANSFORMS = {
  username: usernameTransform,
  numbersOnly: numbersOnlyTransform,
} as const;

export type TransformName = keyof typeof TRANSFORMS;

export interface FieldLiveProps {
  /** Field label */
  label: string;
  /** Current value (from FUSE) */
  value: string;
  /** Save handler - called after typing stops. */
  onSave: (value: string) => Promise<void>;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'tel' | 'number' | 'url';
  /** Required indicator */
  required?: boolean;
  /** Helper text */
  helper?: string;
  /** Transform input as user types - function OR built-in name ('username') */
  transform?: TransformName | ((value: string, currentValue: string) => string);
  /** Multiline textarea mode */
  multiline?: boolean;
  /** Max characters (shows counter when multiline) */
  maxLength?: number;
  /** Textarea rows (default 3) */
  rows?: number;
  /** Disabled/read-only mode */
  disabled?: boolean;
}

const CHIP_TEXT: Record<LiveState, string | null> = {
  idle: null,
  focused: null,
  dirty: null,
  saved: 'Saved ✓',
  error: 'Error',
};

// Default max lengths (sensible limits, can be overridden)
const DEFAULT_MAX_LENGTH = 255;           // Single-line: standard varchar
const DEFAULT_MULTILINE_MAX_LENGTH = 3000; // Multiline: longer text

export default function FieldLive({
  label,
  value,
  onSave,
  placeholder = '',
  type = 'text',
  required = false,
  helper,
  transform,
  multiline = false,
  maxLength,
  rows = 3,
  disabled = false,
}: FieldLiveProps) {
  // Apply default maxLength if not specified
  const effectiveMaxLength = maxLength ?? (multiline ? DEFAULT_MULTILINE_MAX_LENGTH : DEFAULT_MAX_LENGTH);

  const [state, setState] = useState<LiveState>('idle');
  const [localValue, setLocalValue] = useState(value);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalValue = useRef(value);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const badgeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFocused = useRef(false);
  const isSaving = useRef(false);

  // Sync local value when external value changes (FUSE update)
  // BUT only if user is NOT actively typing (prevents overwriting their input)
  useEffect(() => {
    // Don't sync if user is typing or field is focused
    if (isFocused.current || state === 'dirty') {
      return;
    }
    setLocalValue(value);
    originalValue.current = value;
  }, [value, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────
  // Save function - fires after pause OR on blur (speedster)
  // ─────────────────────────────────────────────────────────────────────
  const doSave = useCallback(async (valueToSave: string) => {
    // If already saving, skip (will be caught by next idle period)
    if (isSaving.current) return;

    const trimmed = valueToSave.trim();

    // No change? Just go back to focused
    if (trimmed === originalValue.current) {
      if (isFocused.current) {
        setState('focused');
      } else {
        setState('idle');
      }
      return;
    }

    setLocalValue(trimmed);
    isSaving.current = true;

    try {
      await onSave(trimmed);
      originalValue.current = trimmed;

      // Show "Saved ✓" badge
      setState('saved');

      // Clear any existing badge timeout
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);

      // // 🟨 After 1s, fade badge → faint yellow if focused, idle if not
      badgeTimeoutRef.current = setTimeout(() => {
        if (isFocused.current) {
          setState('focused');
        } else {
          setState('idle');
        }
      }, 1000);
    } catch (err) {
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      isSaving.current = false;
    }
  }, [onSave]);

  // ─────────────────────────────────────────────────────────────────────
  // Event handlers
  // ─────────────────────────────────────────────────────────────────────
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
    isFocused.current = true;
    setState('focused');
    setErrorMessage(null);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;

    // Enforce maxLength
    if (newValue.length > effectiveMaxLength) {
      newValue = newValue.slice(0, effectiveMaxLength);
    }

    // Apply transform if provided (name or function)
    if (transform) {
      const transformFn = typeof transform === 'string' ? TRANSFORMS[transform] : transform;
      newValue = transformFn(newValue, localValue);
    }

    setLocalValue(newValue);
    setState('dirty');

    // Clear any pending save timeout
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Clear any badge fade timeout (user is typing again)
    if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);

    // After SAVE_DELAY_MS of no typing → fire DB save
    saveTimeoutRef.current = setTimeout(() => {
      doSave(newValue);
    }, SAVE_DELAY_MS);
  }, [doSave, transform, localValue, effectiveMaxLength]);

  const handleBlur = useCallback(() => {
    isFocused.current = false;

    // Clear pending save timeout (we'll handle save now)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // SPEEDSTER MODE: Check actual value, not state (state can lag behind)
    const trimmed = localValue.trim();
    const hasUnsavedChanges = trimmed !== originalValue.current;

    if (hasUnsavedChanges && !isSaving.current) {
      setLocalValue(trimmed);

      // INSTANT: Show "Saved ✓" immediately (trickery - save fires in background)
      setState('saved');

      // Clear any existing badge timeout
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);

      // Badge fades after 1s → idle
      badgeTimeoutRef.current = setTimeout(() => {
        setState('idle');
      }, 1000);

      // Fire DB in background - error will override badge if it fails
      onSave(trimmed)
        .then(() => {
          originalValue.current = trimmed;
        })
        .catch((err) => {
          setState('error');
          setErrorMessage(err instanceof Error ? err.message : 'Save failed');
        });
    } else if (!hasUnsavedChanges) {
      // No changes - go idle
      setState('idle');
    }
    // If already saving, let it finish naturally
  }, [localValue, onSave]);

  // CSS classes
  const showChip = state === 'saved' || state === 'error';
  const chipText = CHIP_TEXT[state];

  const wrapperClasses = [
    'vr-field-live',
    state !== 'idle' && `vr-field-live--${state}`,
    helper && 'vr-field--has-helper',
    disabled && 'vr-field-live--disabled',
  ].filter(Boolean).join(' ');

  const chipClasses = [
    'vr-field-live__chip',
    showChip && 'vr-field-live__chip--visible',
    state === 'saved' && 'vr-field-live__chip--saved',
    state === 'error' && 'vr-field-live__chip--error',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <label className="vr-field__label">
        {label}
        {required && <span className="vr-field__required">*</span>}
      </label>
      <div className="vr-field-live__input-wrapper">
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={localValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            data-field={label.toLowerCase().replace(/\s+/g, '-')}
            className="vr-field-live__input vr-field-live__textarea"
          />
        ) : (
          <input
            ref={inputRef}
            type={type}
            value={localValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            data-field={label.toLowerCase().replace(/\s+/g, '-')}
            className="vr-field-live__input"
          />
        )}
        {!multiline && <div className={chipClasses}>{chipText}</div>}
      </div>
      {multiline && (
        <div className="vr-field-live__counter">
          <T.caption>{localValue.length} / {effectiveMaxLength} characters</T.caption>
        </div>
      )}
      {helper && state !== 'error' && (
        <div className="vr-field__helper"><T.caption>{helper}</T.caption></div>
      )}
      {errorMessage && state === 'error' && (
        <div className="vr-field__error"><T.caption>{errorMessage}</T.caption></div>
      )}
    </div>
  );
}
