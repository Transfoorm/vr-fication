/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Table Search Hook                                   │
│  /src/prebuilts/table/useTableSearch.ts                                 │
│                                                                         │
│  Auto-generates search filter from columns.                             │
│  Excludes checkbox and actions variants automatically.                  │
│                                                                         │
│  Usage:                                                                 │
│  const { searchTerm, setSearchTerm, filteredData } = useTableSearch({  │
│    data: tableData,                                                     │
│    columns: columns,                                                    │
│  });                                                                    │
└─────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useMemo } from 'react';
import type { SortableColumn } from './Sortable';

interface UseTableSearchProps<TData, TRowId = string> {
  /** Raw data array */
  data: TData[];
  /** Column definitions - searchable columns auto-detected */
  columns: SortableColumn<TData, TRowId>[];
}

interface UseTableSearchReturn<TData> {
  /** Current search term */
  searchTerm: string;
  /** Update search term */
  setSearchTerm: (term: string) => void;
  /** Filtered data based on search */
  filteredData: TData[];
  /** Total count (before filter) */
  totalCount: number;
  /** Results count (after filter) */
  resultsCount: number;
  /** True when search is active (allows select all on filtered results) */
  isFiltered: boolean;
}

/**
 * Auto-search hook for Table.sortable
 *
 * Automatically searches all columns EXCEPT:
 * - variant: 'checkbox'
 * - variant: 'actions' (crud, view, document, admin)
 * - key: 'actions'
 * - key: 'select'
 */
export function useTableSearch<TData extends Record<string, unknown>, TRowId = string>({
  data,
  columns,
}: UseTableSearchProps<TData, TRowId>): UseTableSearchReturn<TData> {
  const [searchTerm, setSearchTerm] = useState('');

  // Determine searchable columns (exclude checkbox, actions)
  const searchableKeys = useMemo(() => {
    const excludedVariants = ['checkbox', 'crud', 'view', 'document', 'admin'];
    const excludedKeys = ['select', 'actions'];

    return columns
      .filter(col =>
        !excludedKeys.includes(col.key) &&
        (!col.variant || !excludedVariants.includes(col.variant))
      )
      .map(col => col.key);
  }, [columns]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter(row =>
      searchableKeys.some(key => {
        const value = row[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm, searchableKeys]);

  // Search is active when there's a search term AND it actually filters results
  const isFiltered = searchTerm.trim().length > 0 && filteredData.length < data.length;

  return {
    searchTerm,
    setSearchTerm,
    filteredData,
    totalCount: data.length,
    resultsCount: filteredData.length,
    isFiltered,
  };
}

export default useTableSearch;
