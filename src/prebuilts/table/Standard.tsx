/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Standard Table                                     │
│  /src/components/prebuilts/table/standard/index.tsx                    │
│                                                                        │
│  Basic table with rows and columns.                                    │
│                                                                        │
│  Usage:                                                                │
│  import { TableVC } from '@/prebuilts/table';              │
│  <TableVC.standard columns={columns} data={data} />                  │
└────────────────────────────────────────────────────────────────────────┘ */

"use client";

import { ReactNode } from 'react';

export interface Column<TData = Record<string, unknown>> {
  key: string;
  header: string | ReactNode;
  render?: (value: unknown, row: TData) => ReactNode;
  width?: string;
}

export interface StandardTableProps<TData = Record<string, unknown>> {
  columns: Column<TData>[];
  data: TData[];
  striped?: boolean;
  bordered?: boolean;
  className?: string;
}

/**
 * StandardTable - Basic table layout
 *
 * Features:
 * - Column-based configuration
 * - Custom cell rendering
 * - Row hover effects
 * - Optional striping
 * - Optional borders
 *
 * Perfect for:
 * - Data lists
 * - Reports
 * - Simple data display
 * - User lists
 */
export default function StandardTable<TData = Record<string, unknown>>({
  columns,
  data,
  striped = false,
  bordered = false,
  className = '',
}: StandardTableProps<TData>) {
  return (
    <div className="vr-table-container">
      <table
        className={`vr-table vr-table-standard ${striped ? 'vr-table-standard-striped' : ''} ${bordered ? 'vr-table-standard-bordered' : ''} ${className}`}
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
          {data.map((row, rowIndex) => (
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
  );
}
