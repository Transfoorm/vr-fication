/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Dropdown with Avatars                             │
│  /src/components/prebuilts/dropdown/withAvatars/index.tsx             │
│                                                                        │
│  User selection dropdown with avatars and names.                      │
│  Perfect for assigning users, selecting team members, ownership.      │
│                                                                        │
│  Usage:                                                                │
│  <Dropdown.withAvatars                                                 │
│    options={[                                                          │
│      {                                                                 │
│        value: 'user1',                                                 │
│        name: 'John Doe',                                               │
│        email: 'john@example.com',                                      │
│        avatar: '/avatars/john.jpg',                                    │
│        initials: 'JD'                                                  │
│      }                                                                 │
│    ]}                                                                  │
│    value="user1"                                                       │
│    onChange={(value) => handleChange(value)}                          │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useRef, useEffect } from 'react';

export interface AvatarDropdownOption {
  value: string;
  name: string;
  email?: string;
  avatar?: string;  // Avatar image URL
  initials?: string;  // Fallback initials if no avatar
  disabled?: boolean;
}

export interface AvatarDropdownProps {
  options: AvatarDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  showEmail?: boolean;  // Show email in dropdown
}

/**
 * Dropdown.withAvatars - User selection with avatars
 *
 * Features:
 * - Circular avatar images
 * - Initials fallback if no avatar
 * - Name + optional email display
 * - Keyboard accessible
 * - Perfect for user assignment
 *
 * TRUE VR: Essential for any user management
 */
export default function AvatarDropdown({
  options,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select user',
  className = '',
  showEmail = true,
}: AvatarDropdownProps) {
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

  const renderAvatar = (option: AvatarDropdownOption) => {
    if (option.avatar) {
      return (
         
        <img src={option.avatar} alt={option.name} className="vr-dropdown-with-avatars-avatar" />
      );
    }

    // Fallback to initials
    return (
      <div className="vr-dropdown-with-avatars-initials">
        {option.initials || option.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div
      className={`vr-dropdown-with-avatars ${disabled ? 'vr-dropdown-with-avatars--disabled' : ''} ${className}`}
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Current selection button */}
      <button
        type="button"
        className="vr-dropdown-with-avatars-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="vr-dropdown-with-avatars-current">
          {selectedOption ? (
            <>
              {renderAvatar(selectedOption)}
              <span className="vr-dropdown-with-avatars-name">{selectedOption.name}</span>
            </>
          ) : (
            <span className="vr-dropdown-with-avatars-placeholder">{placeholder}</span>
          )}
        </div>
        <svg
          className={`vr-dropdown-with-avatars-arrow ${isOpen ? 'vr-dropdown-with-avatars-arrow--open' : ''}`}
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
        <div className="vr-dropdown-with-avatars-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                className={`vr-dropdown-with-avatars-option ${isSelected ? 'vr-dropdown-with-avatars-option--selected' : ''} ${option.disabled ? 'vr-dropdown-with-avatars-option--disabled' : ''}`}
                onClick={() => !option.disabled && handleSelect(option.value)}
              >
                {renderAvatar(option)}
                <div className="vr-dropdown-with-avatars-info">
                  <div className="vr-dropdown-with-avatars-name">{option.name}</div>
                  {showEmail && option.email && (
                    <div className="vr-dropdown-with-avatars-email">{option.email}</div>
                  )}
                </div>
                {isSelected && (
                  <svg
                    className="vr-dropdown-with-avatars-check"
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
