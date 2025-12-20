/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Input Textarea                                     │
│  /src/vr/input/textarea/index.tsx                    │
│                                                                        │
│  Multiline text input with optional character counting.               │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useRef, useEffect } from 'react';
import { T } from '@/vr/typography';

export interface InputTextareaProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Max character length */
  maxLength?: number;
  /** Show character counter */
  showCounter?: boolean;
  /** Auto-resize to content */
  autoResize?: boolean;
  /** Minimum rows */
  rows?: number;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * InputTextarea - Multiline text input
 * TTT Gap Model compliant - no external margins
 */
export default function InputTextarea({
  value,
  onChange,
  placeholder,
  maxLength,
  showCounter = false,
  autoResize = false,
  rows = 3,
  disabled = false,
  className = ''
}: InputTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  const classes = [
    'vr-input-textarea',
    autoResize && 'vr-input-textarea--auto-resize',
    className
  ].filter(Boolean).join(' ');

  const charCount = value.length;
  const isWarning = maxLength && charCount > maxLength * 0.8;
  const isError = maxLength && charCount > maxLength;

  const counterClasses = [
    'vr-input-textarea-counter',
    isError && 'vr-input-textarea-counter--error',
    !isError && isWarning && 'vr-input-textarea-counter--warning'
  ].filter(Boolean).join(' ');

  const textarea = (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      disabled={disabled}
      className={classes}
    />
  );

  if (!showCounter) return textarea;

  return (
    <div className="vr-input-textarea-wrapper">
      {textarea}
      {showCounter && (
        <div className={counterClasses}>
          <T.caption>{charCount}{maxLength && ` / ${maxLength}`} characters</T.caption>
        </div>
      )}
    </div>
  );
}
