/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Paginated Table                                    │
│  /src/components/prebuilts/table/paginated/index.tsx                   │
│                                                                        │
│  Table with pagination controls.                                       │
│                                                                        │
│  Usage:                                                                │
│  import { TableVC } from '@/prebuilts/table';              │
│  <TableVC.paginated columns={columns} data={data} pageSize={10} />  │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode, useState } from 'react';
import { T } from '@/prebuilts/typography';

export interface PaginatedColumn<TData = Record<string, unknown>> {
  key: string;
  header: string | ReactNode;
  render?: (value: unknown, row: TData) => ReactNode;
  width?: string;
}

export interface PaginatedTableProps<TData = Record<string, unknown>> {
  columns: PaginatedColumn<TData>[];
  data: TData[];
  pageSize?: number;
  striped?: boolean;
  bordered?: boolean;
  className?: string;
}

/**
 * PaginatedTable - Table with pagination
 *
 * Features:
 * - Page size control
 * - Page navigation
 * - Total count display
 * - Custom cell rendering
 * - Optional striping
 *
 * Perfect for:
 * - Large datasets
 * - User lists
 * - Product catalogs
 * - Search results
 */
export default function PaginatedTable<TData = Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  striped = false,
  bordered = false,
  className = '',
}: PaginatedTableProps<TData>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="vr-table-paginated-container">
      <div className="vr-table-container">
        <table
          className={`vr-table vr-table-paginated ${striped ? 'vr-table-paginated-striped' : ''} ${bordered ? 'vr-table-paginated-bordered' : ''} ${className}`}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  {...(col.width && { style: { width: col.width } })}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render((row as Record<string, unknown>)[col.key], row) : ((row as Record<string, unknown>)[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="vr-pagination-controls">
        <div className="vr-pagination-info">
          <T.caption>Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}</T.caption>
        </div>
        <div className="vr-pagination-buttons">
          <button
            className="vr-pagination-button"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
          >
            <T.caption>«</T.caption>
          </button>
          <button
            className="vr-pagination-button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <T.caption>‹</T.caption>
          </button>
          <span className="vr-pagination-current">
            <T.caption>Page {currentPage} of {totalPages}</T.caption>
          </span>
          <button
            className="vr-pagination-button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <T.caption>›</T.caption>
          </button>
          <button
            className="vr-pagination-button"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <T.caption>»</T.caption>
          </button>
        </div>
      </div>
    </div>
  );
}
