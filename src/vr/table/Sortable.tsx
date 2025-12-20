/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Sortable Table                                     │
│  /src/vr/table/sortable/index.tsx                               │
│                                                                         │
│  Self-contained sortable table with all styling in one CSS file.       │
│  No scattered dependencies. True VR pattern.                           │
└─────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, useState, useMemo } from 'react';
import { Tooltip } from '@/vr';
import TableCheckbox from './TableCheckbox';
import { Actions } from '@/vr/actions';

export interface SortableColumn<TData = Record<string, unknown>, TRowId = string> {
  key: string;
  header?: string | ReactNode;
  render?: (value: unknown, row: TData) => ReactNode;
  sortable?: boolean;
  width?: string;
  // Cell styling
  cellAlign?: 'left' | 'center' | 'right';
  // Action column variant
  variant?: 'crud' | 'view' | 'document' | 'admin' | 'checkbox';
  // Action handlers
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onView?: (row: TData) => void;
  onEmail?: (row: TData) => void;
  onFlag?: (row: TData) => void;
  // Action disable flags
  disableEdit?: boolean | ((row: TData) => boolean);
  disableDelete?: boolean | ((row: TData) => boolean);
  // Action tooltips (for smart tooltip behavior)
  editTooltip?: string | ((row: TData) => string);
  deleteTooltip?: string | ((row: TData) => string);
  // Checkbox handlers (for variant='checkbox')
  checked?: Set<TRowId>;  // Set of checked row IDs (string, number, or Id<table>)
  onCheck?: (id: TRowId) => void;  // Handler for row checkbox
  onHeaderCheck?: () => void;  // Handler for header checkbox
  getRowId?: (row: TData) => TRowId;  // Extract ID from row (defaults to row.id)
  getRowLabel?: (row: TData) => string;  // Extract label for aria-label
  // Checkbox behavior (for smart disable/tooltip)
  disableCheckbox?: (row: TData) => boolean;  // Function to determine if checkbox should be disabled
  checkboxTooltip?: (row: TData) => string | undefined;  // Function to return tooltip text (undefined = no tooltip)
  headerTooltip?: string;  // Tooltip for header checkbox (Feature-controlled)
  tooltipSize?: 'sm' | 'md' | 'lg';  // Size variant for tooltips
  // Batch delete (VR auto-renders batch actions when provided)
  onBatchDelete?: (ids: TRowId[]) => void;  // Handler for batch delete
  batchLabel?: string;  // Label for batch actions (e.g., "entry/entries" or "user/users")
}

export interface SortableTableProps<TData = Record<string, unknown>, TRowId = string> {
  columns: SortableColumn<TData, TRowId>[];
  data: TData[];
  striped?: boolean;
  bordered?: boolean;
  className?: string;
  // Auto-sort overrides (VR auto-detects date columns if not provided)
  defaultSortKey?: string | null;
  defaultSortDirection?: 'asc' | 'desc';
  // When true, allows "select all" (data is filtered, not entire database)
  isFiltered?: boolean;
}

type SortDirection = 'asc' | 'desc' | null;

/**
 * Auto-detect date column for default sorting
 * Matches common date column patterns
 */
function detectDateColumn<TData, TRowId = string>(columns: SortableColumn<TData, TRowId>[]): string | null {
  const datePatterns = [
    'createdAt',
    'dateDisplay',
    'created',
    'date',
    'updated',
    'updatedAt',
    'timestamp',
    '_creationTime'
  ];

  for (const pattern of datePatterns) {
    const match = columns.find(col =>
      col.key.toLowerCase().includes(pattern.toLowerCase()) &&
      col.sortable !== false &&
      col.variant !== 'checkbox'
    );
    if (match) return match.key;
  }

  return null;
}

/**
 * SortableTable - Self-contained sortable table
 *
 * All table styling lives in table-sortable.css
 * Uses CSS variables for theming
 * No scattered fuse-* classes
 *
 * Auto-sorts by date columns (desc) by default - override with props if needed
 */
export default function SortableTable<TData = Record<string, unknown>, TRowId = string>({
  columns,
  data,
  striped = false,
  bordered = false,
  className = '',
  defaultSortKey,
  defaultSortDirection = 'desc',
  isFiltered = false,
}: SortableTableProps<TData, TRowId>) {
  // VR Auto-Detection: Use explicit prop, or auto-detect date column, or null
  const initialSortKey = defaultSortKey !== undefined
    ? defaultSortKey
    : detectDateColumn(columns);

  const [sortKey, setSortKey] = useState<string | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    initialSortKey ? defaultSortDirection : 'asc'
  );

  const handleSort = (key: string, sortable: boolean = true) => {
    if (!sortable) return;

    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!data) return [];

    return [...data].sort((a, b) => {
      if (!sortKey || !sortDirection) return 0;

      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        const diff = aVal - bVal;
        return sortDirection === 'asc' ? diff : -diff;
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const lowerA = aVal.toLowerCase();
        const lowerB = bVal.toLowerCase();
        if (lowerA < lowerB) return sortDirection === 'asc' ? -1 : 1;
        if (lowerA > lowerB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDirection]);

  return (
    <div className="vr-table-sortable-container">
      <div className="vr-table-wrapper">
        <table
          className={`vr-table-sortable ${striped ? 'vr-table-sortable-striped' : ''} ${bordered ? 'vr-table-sortable-bordered' : ''} ${className}`}
        >
        <thead>
          <tr>
            {columns.map((col) => {
              // VR Convention: Checkbox variant auto-renders header checkbox
              let headerContent: ReactNode;

              if (col.variant === 'checkbox') {
                const hasSelections = !!(col.checked && col.checked.size > 0);
                const checkbox = (
                  <TableCheckbox
                    checked={hasSelections}
                    onChange={() => col.onHeaderCheck?.()}
                    ariaLabel={hasSelections ? "Clear all selections" : "Select all"}
                  />
                );
                // Feature-controlled header tooltip (if provided)
                headerContent = (hasSelections || isFiltered || !col.headerTooltip) ? checkbox : (
                  <Tooltip.caret content={col.headerTooltip} size={col.tooltipSize || 'sm'}>
                    {checkbox}
                  </Tooltip.caret>
                );
              } else if (typeof col.header === 'string') {
                headerContent = (
                  <>
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="vr-table-sortable-sort-indicator">
                        {sortKey === col.key ? (
                          sortDirection === 'asc' ? '▲' : '▼'
                        ) : '▼'}
                      </span>
                    )}
                  </>
                );
              } else {
                headerContent = col.header;
              }

              // VR Convention: Variant-based automatic widths
              // - Checkbox: 46px (single checkbox column)
              // - Actions: 100px for 2 icons (crud, view), 120px for 3 icons (document, admin), 140px for 4 icons, etc.
              let columnWidth = col.width;
              if (col.variant === 'checkbox') { columnWidth = '51px';
              } else if (col.variant === 'crud' || col.variant === 'view') { columnWidth = '75px'; // 2 icons
              } else if (col.variant === 'document' || col.variant === 'admin') { columnWidth = '100px'; // 3 icons
              }

              return (
                <th
                  key={col.key}
                  className={`${col.sortable !== false && col.variant !== 'checkbox' ? 'sortable' : ''} ${sortKey === col.key ? 'active' : ''}`}
                  onClick={() => col.variant !== 'checkbox' && handleSort(col.key, col.sortable !== false)}
                  {...(columnWidth && { style: { width: columnWidth } })}
                >
                  <div className="vr-table-sortable-header-content">
                    {headerContent}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => {
                let cellContent: ReactNode;

                if (col.render) {
                  // Custom render function provided
                  cellContent = col.render((row as Record<string, unknown>)[col.key], row);
                } else if (col.variant === 'checkbox') {
                  // VR Convention: Auto-generate checkbox with smart disable/tooltip + self-protection
                  const getRowId = col.getRowId || ((r: TData) => (r as Record<string, unknown>).id as TRowId);
                  const getRowLabel = col.getRowLabel || ((r: TData) => {
                    const rowData = r as Record<string, unknown>;
                    return `${rowData.firstName || 'Row'}`;
                  });
                  const rowId = getRowId(row);

                  // VR Convention: Feature provides disable/tooltip logic via props
                  const isDisabled = col.disableCheckbox ? col.disableCheckbox(row) : false;
                  const tooltipText = col.checkboxTooltip ? col.checkboxTooltip(row) : undefined;

                  const checkbox = (
                    <TableCheckbox
                      checked={col.checked ? col.checked.has(rowId) : false}
                      onChange={() => col.onCheck?.(rowId)}
                      disabled={isDisabled}
                      ariaLabel={`Select ${getRowLabel(row)}`}
                    />
                  );

                  // Wrap in tooltip if tooltipText is provided
                  cellContent = tooltipText ? (
                    <Tooltip.caret content={tooltipText} size={col.tooltipSize || 'sm'}>
                      {checkbox}
                    </Tooltip.caret>
                  ) : checkbox;
                } else if (col.key === 'actions' && col.variant) {
                  // VR Convention: Auto-generate action icons based on variant with smart tooltips
                  // TypeScript knows checkbox is already handled above
                  type ActionVariant = 'crud' | 'view' | 'document' | 'admin';
                  const ActionComponent = Actions[col.variant as ActionVariant];
                  cellContent = (
                    <div className="vr-table-actions-wrapper">
                      <ActionComponent
                        row={row}
                        onEdit={col.onEdit}
                        onDelete={col.onDelete}
                        onView={col.onView}
                        onEmail={col.onEmail}
                        onFlag={col.onFlag}
                        disableEdit={col.disableEdit}
                        disableDelete={col.disableDelete}
                        editTooltip={col.editTooltip}
                        deleteTooltip={col.deleteTooltip}
                      />
                    </div>
                  );
                } else {
                  cellContent = (row as Record<string, unknown>)[col.key] as ReactNode;
                }

                const alignClass = col.cellAlign === 'center' ? 'cell-align-center' : col.cellAlign === 'right' ? 'cell-align-right' : '';
                return (
                  <td
                    key={col.key}
                    className={`cell-${col.key} ${alignClass}`.trim()}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
