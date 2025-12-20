/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Multi-Select Dropdown                             │
│  /src/components/prebuilts/dropdown/multiSelect/index.tsx             │
│                                                                        │
│  Multiple selection dropdown with checkboxes.                         │
│  Perfect for tags, filters, permissions, categories.                  │
│                                                                        │
│  Usage:                                                                │
│  <Dropdown.multiSelect                                                 │
│    options={[                                                          │
│      { value: 'tag1', label: 'Marketing' },                           │
│      { value: 'tag2', label: 'Sales' },                               │
│    ]}                                                                  │
│    value={['tag1', 'tag2']}                                           │
│    onChange={(values) => handleChange(values)}                        │
│    placeholder="Select tags"                                          │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  value: string[];  // Array of selected values
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  maxDisplayTags?: number;  // Max tags to show before "+N more"
  className?: string;
}

/**
 * Dropdown.multiSelect - Multiple selection with checkboxes
 *
 * Features:
 * - Checkbox for each option
 * - Shows selected count as tags
 * - "+N more" when many selected
 * - Clear all button
 * - Keyboard accessible
 * - Stay open on selection (click outside to close)
 *
 * TRUE VR: Essential for filtering and bulk operations
 */
export default function MultiSelectDropdown({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select options',
  maxDisplayTags = 2,
  className = '',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(opt => value.includes(opt.value));
  const selectedCount = value.length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      // Remove
      onChange(value.filter(v => v !== optionValue));
    } else {
      // Add
      onChange([...value, optionValue]);
    }
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`vr-dropdown-multi-select ${disabled ? 'vr-dropdown-multi-select--disabled' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Current selection button */}
      <button
        type="button"
        className="vr-dropdown-multi-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="vr-dropdown-multi-select-current">
          {selectedCount > 0 ? (
            <div className="vr-dropdown-multi-select-tags">
              {selectedOptions.slice(0, maxDisplayTags).map(opt => (
                <span key={opt.value} className="vr-dropdown-multi-select-tag">
                  {opt.label}
                </span>
              ))}
              {selectedCount > maxDisplayTags && (
                <span className="vr-dropdown-multi-select-more">
                  +{selectedCount - maxDisplayTags} more
                </span>
              )}
            </div>
          ) : (
            <span className="vr-dropdown-multi-select-placeholder">{placeholder}</span>
          )}
        </div>

        <div className="vr-dropdown-multi-select-actions">
          {selectedCount > 0 && (
            <button
              type="button"
              className="vr-dropdown-multi-select-clear"
              onClick={handleClearAll}
              aria-label="Clear all"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
          <svg
            className={`vr-dropdown-multi-select-arrow ${isOpen ? 'vr-dropdown-multi-select-arrow--open' : ''}`}
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
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="vr-dropdown-multi-select-menu" role="listbox">
          {options.map((option) => {
            const isSelected = value.includes(option.value);

            return (
              <label
                key={option.value}
                className={`vr-dropdown-multi-select-option ${isSelected ? 'vr-dropdown-multi-select-option--selected' : ''} ${option.disabled ? 'vr-dropdown-multi-select-option--disabled' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={option.disabled}
                  onChange={() => !option.disabled && handleToggle(option.value)}
                  className="vr-dropdown-multi-select-checkbox"
                />
                <div className="vr-dropdown-multi-select-checkbox-custom">
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="vr-dropdown-multi-select-option-label">{option.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
