/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Table Component Registry                           │
│  /src/prebuilts/table/index.tsx                                        │
│                                                                        │
│  Central dispatcher for all table variants + utilities.                │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Table } from '@/prebuilts/table';                            │
│                                                                        │
│  <Table.toolbar search={...} actions={...} />                          │
│  <Table.sortable columns={cols} data={data} />                         │
│  <Table.batchActions selectedCount={n} onDelete={fn} />                │
└─────────────────────────────────────────────────────────────────────────┘ */


import StandardTable from './Standard';
import SortableTable from './Sortable';
import PaginatedTable from './Paginated';
import Toolbar from './Toolbar';
import BatchActions from './BatchActions';
import TableCheckbox from './TableCheckbox';
import { useTableSearch } from './useTableSearch';

/**
 * Table Registry - All table variants + utilities as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused tables aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 * ✅ AI/CLI friendly: "Give me a sortable table" → Table.sortable
 */
export const Table = {
  // Table variants
  standard: StandardTable,
  sortable: SortableTable,
  paginated: PaginatedTable,
  // Layout utilities
  toolbar: Toolbar,
  batchActions: BatchActions,
  checkbox: TableCheckbox,
} as const;

// Export individual components for direct import if needed
export {
  StandardTable,
  SortableTable,
  PaginatedTable,
  Toolbar,
  BatchActions,
  TableCheckbox,
  useTableSearch
};

// Type exports for TypeScript users
export type { StandardTableProps, Column } from './Standard';
export type { SortableTableProps, SortableColumn } from './Sortable';
export type { PaginatedTableProps, PaginatedColumn } from './Paginated';
export type { ToolbarProps } from './Toolbar';
export type { BatchActionsProps } from './BatchActions';
export type { TableCheckboxProps } from './TableCheckbox';

// Helper type for variant names
export type TableVariant = keyof typeof Table;
