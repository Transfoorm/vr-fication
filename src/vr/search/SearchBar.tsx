/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Search Bar                                        │
│  /src/components/prebuilts/search/bar/index.tsx                       │
│                                                                        │
│  Search bar for filtering tables and lists with result counts.        │
│                                                                        │
│  Usage:                                                                │
│  import { Search } from '@/vr';                     │
│  <Search.bar                                                          │
│    value={searchTerm}                                                 │
│    onChange={setSearchTerm}                                           │
│    placeholder="Search users..."                                      │
│    resultsCount={filteredUsers.length}                                │
│    totalCount={users?.length || 0}                                    │
│  />                                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { Icon } from '@/vr';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultsCount?: number;
  totalCount?: number;
  className?: string;
  width?: string;
}

/**
 * SearchBar - Filter bar for tables and lists
 *
 * Features:
 * - Search icon indicator
 * - Clear button when text present
 * - Result count display
 * - Responsive layout
 * - Keyboard accessible
 *
 * Perfect for:
 * - Table filtering
 * - List searching
 * - Data exploration
 * - User lookup
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  resultsCount,
  totalCount,
  className = '',
  width
}: SearchBarProps) {
  const handleClear = () => {
    onChange('');
  };

  const showClearButton = value.trim().length > 0;
  const showCounts = resultsCount !== undefined && totalCount !== undefined;

  return (
     
    <div className={`vr-search-bar ${className}`} style={width ? { width } : undefined}>
      {/* Search Icon */}
      <div className="vr-search-bar-search-icon">
        <Icon variant="search" size="sm" />
      </div>

      {/* Input Field */}
      <input
        type="text"
        className="vr-search-bar-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />

      {/* Clear Button */}
      {showClearButton && (
        <button
          type="button"
          className="vr-search-bar-search-clear"
          onClick={handleClear}
          aria-label="Clear search"
          title="Clear search"
        >
          <Icon variant="x" size="sm" />
        </button>
      )}

      {/* Results Count */}
      {showCounts && (
        <span className="vr-search-bar-search-count">
          {resultsCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
