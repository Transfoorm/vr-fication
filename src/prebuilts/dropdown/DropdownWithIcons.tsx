/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Dropdown with Icons                               │
│  /src/components/prebuilts/dropdown/withIcons/index.tsx               │
│                                                                        │
│  Generic custom dropdown with icon/image support.                     │
│  Replaces native <select> to support images in options.               │
│                                                                        │
│  Usage:                                                                │
│  <Dropdown.withIcons                                                   │
│    options={[                                                          │
│      { value: 'opt1', label: 'Option 1', icon: '/images/opt1.png' },  │
│      { value: 'opt2', label: 'Option 2', icon: '/images/opt2.png' },  │
│    ]}                                                                  │
│    value="opt1"                                                        │
│    onChange={(value) => handleChange(value)}                          │
│    disabled={false}                                                    │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: string;  // Optional icon/image URL
}

export interface DropdownWithIconsProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Dropdown.withIcons - Generic custom dropdown with icon support
 *
 * Features:
 * - Shows current selection with optional icon
 * - Custom dropdown with all options and icons
 * - Keyboard accessible (Escape to close)
 * - Click outside to close
 * - Disabled state support
 * - Fully customizable via options prop
 *
 * TRUE VR: Generic, reusable, self-contained
 */
export default function DropdownWithIcons({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
}: DropdownWithIconsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

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

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      className={`vr-dropdown-with-icons ${disabled ? 'vr-dropdown-with-icons--disabled' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Current selection button */}
      <button
        type="button"
        className="vr-dropdown-with-icons-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="vr-dropdown-with-icons-current">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                 
                <img src={selectedOption.icon} alt={selectedOption.label} className="vr-dropdown-with-icons-icon" />
              )}
              <span className="vr-dropdown-with-icons-label">{selectedOption.label}</span>
            </>
          ) : (
            <span className="vr-dropdown-with-icons-placeholder">{placeholder}</span>
          )}
        </div>
        <svg
          className={`vr-dropdown-with-icons-arrow ${isOpen ? 'vr-dropdown-with-icons-arrow--open' : ''}`}
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
        <div className="vr-dropdown-with-icons-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`vr-dropdown-with-icons-option ${isSelected ? 'vr-dropdown-with-icons-option--selected' : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.icon && (
                   
                  <img src={option.icon} alt={option.label} className="vr-dropdown-with-icons-icon" />
                )}
                <span className="vr-dropdown-with-icons-label">{option.label}</span>
                {isSelected && (
                  <svg
                    className="vr-dropdown-with-icons-check"
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
        </div>
      )}
    </div>
  );
}
