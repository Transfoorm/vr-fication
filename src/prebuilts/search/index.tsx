/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Search Component Registry                         │
│  /src/components/prebuilts/search/index.tsx                           │
│                                                                        │
│  Central dispatcher for all search variants.                          │
│  Each variant is a first-class, autonomous component.                 │
│                                                                        │
│  Usage:                                                                │
│  import { Search } from '@/prebuilts/search';              │
│                                                                        │
│  <Search.bar                                                          │
│    value={searchTerm}                                                 │
│    onChange={setSearchTerm}                                           │
│    placeholder="Search users..."                                      │
│    resultsCount={filteredUsers.length}                                │
│    totalCount={users?.length || 0}                                    │
│  />                                                                   │
└────────────────────────────────────────────────────────────────────────┘ */

import SearchBar from './SearchBar';

/**
 * Search Registry - All search variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused variants aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 * ✅ AI/CLI friendly: "Give me a search bar" → Search.bar
 */
export const Search = {
  bar: SearchBar,
} as const;

// Export individual components for direct import if needed
export {
  SearchBar,
};

// Type exports for TypeScript users
export type { SearchBarProps } from './SearchBar';

// Helper type for variant names
export type SearchVariant = keyof typeof Search;
