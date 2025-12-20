/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Simple Dropdown                                   │
│  /src/components/prebuilts/dropdown/simple/index.tsx                  │
│                                                                        │
│  Basic custom dropdown with text-only options.                        │
│  Replaces native <select> with better styling and control.            │
│                                                                        │
│  Features:                                                             │
│  - allowOther: Adds "Other ✏️" option that opens inline text input    │
│  - Custom values stored as-is (no schema changes needed)              │
│                                                                        │
│  Usage:                                                                │
│  <Dropdown.simple                                                      │
│    options={[                                                          │
│      { value: 'draft', label: 'Draft' },                              │
│      { value: 'published', label: 'Published' },                      │
│    ]}                                                                  │
│    value="draft"                                                       │
│    onChange={(value) => handleChange(value)}                          │
│    placeholder="Select status"                                        │
│    allowOther                                                          │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil } from 'lucide-react';

export interface SimpleDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SimpleDropdownProps {
  options: SimpleDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Field label displayed above dropdown */
  label?: string;
  /** Required indicator */
  required?: boolean;
  /** Allow custom "Other" option with text input */
  allowOther?: boolean;
  /** Placeholder for "Other" text input */
  otherPlaceholder?: string;
}

/**
 * Dropdown.simple - Basic text dropdown
 *
 * Features:
 * - Clean text-only options
 * - Keyboard accessible (Escape to close, Enter to select)
 * - Click outside to close
 * - Disabled state support
 * - allowOther: Adds "Other ✏️" for custom text input
 * - Minimal, fast, clean
 *
 * TRUE VR: Most common dropdown use case
 */
export default function SimpleDropdown({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
  label,
  required = false,
  allowOther = false,
  otherPlaceholder = 'Type your answer...',
}: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOtherMode, setIsOtherMode] = useState(false);
  const [otherValue, setOtherValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Check if current value is a custom "other" value (not in options)
  const isCustomValue = allowOther && value && !selectedOption;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If in other mode and no value entered, exit other mode
        if (isOtherMode && !otherValue.trim()) {
          setIsOtherMode(false);
        }
      }
    };

    if (isOpen || isOtherMode) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, isOtherMode, otherValue]);

  // Focus input when entering other mode
  useEffect(() => {
    if (isOtherMode && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [isOtherMode]);

  // Initialize otherValue if current value is custom
  useEffect(() => {
    if (isCustomValue) {
      setOtherValue(value);
    }
  }, [isCustomValue, value]);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setIsOtherMode(false);
    setOtherValue('');
  }, [onChange]);

  const handleOtherClick = useCallback(() => {
    setIsOpen(false);
    setIsOtherMode(true);
    setOtherValue(isCustomValue ? value : '');
  }, [isCustomValue, value]);

  const handleOtherSubmit = useCallback(() => {
    const trimmed = otherValue.trim();
    if (trimmed) {
      onChange(trimmed);
    }
    setIsOtherMode(false);
  }, [otherValue, onChange]);

  const handleOtherKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOtherSubmit();
    } else if (e.key === 'Escape') {
      setIsOtherMode(false);
      setOtherValue('');
    }
  }, [handleOtherSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Display label: selected option, custom value, or placeholder
  const displayLabel = selectedOption?.label || (isCustomValue ? value : null);

  return (
    <div
      className={`vr-dropdown-simple ${disabled ? 'vr-dropdown-simple--disabled' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Label */}
      {label && (
        <label className="vr-dropdown-simple__label">
          {label}
          {required && <span className="vr-dropdown-simple__required">*</span>}
        </label>
      )}

      {/* Other mode: inline text input */}
      {isOtherMode ? (
        <div className="vr-dropdown-simple-other">
          <input
            ref={otherInputRef}
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={handleOtherKeyDown}
            onBlur={handleOtherSubmit}
            placeholder={otherPlaceholder}
            className="vr-dropdown-simple-other__input"
          />
        </div>
      ) : (
        <>
          {/* Current selection button */}
          <button
            type="button"
            className={`vr-dropdown-simple-trigger ${isCustomValue ? 'vr-dropdown-simple-trigger--custom' : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className={displayLabel ? 'vr-dropdown-simple-label' : 'vr-dropdown-simple-placeholder'}>
              {displayLabel || placeholder}
            </span>
            {isCustomValue && (
              <Pencil size={14} className="vr-dropdown-simple-custom-icon" />
            )}
            <svg
              className={`vr-dropdown-simple-arrow ${isOpen ? 'vr-dropdown-simple-arrow--open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="vr-dropdown-simple-menu" role="listbox">
              {options.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={`vr-dropdown-simple-option ${isSelected ? 'vr-dropdown-simple-option--selected' : ''} ${option.disabled ? 'vr-dropdown-simple-option--disabled' : ''}`}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                  >
                    <span className="vr-dropdown-simple-option-label">{option.label}</span>
                    {isSelected && (
                      <svg
                        className="vr-dropdown-simple-check"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13.3333 4L6 11.3333L2.66667 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}

              {/* Other option */}
              {allowOther && (
                <button
                  type="button"
                  className={`vr-dropdown-simple-option vr-dropdown-simple-option--other ${isCustomValue ? 'vr-dropdown-simple-option--selected' : ''}`}
                  onClick={handleOtherClick}
                >
                  <span className="vr-dropdown-simple-option-label vr-dropdown-simple-option-other-label">
                    Custom <Pencil size={12} />
                  </span>
                  {isCustomValue && (
                    <svg
                      className="vr-dropdown-simple-check"
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                    >
                      <path
                        d="M13.3333 4L6 11.3333L2.66667 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
