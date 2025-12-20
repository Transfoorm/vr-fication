/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Table Toolbar                                       │
│  /src/prebuilts/table/Toolbar.tsx                                       │
│                                                                         │
│  Layout-only VR: Search left, actions right. Zero layout shift.         │
│  No logic. No state. Pure layout composition.                           │
│                                                                         │
│  Usage:                                                                 │
│  <Table.toolbar                                                         │
│    search={<Search.bar ... />}                                          │
│    actions={<Table.batchActions ... />}                                 │
│  />                                                                     │
└─────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';

export interface ToolbarProps {
  /** Left side - typically Search.bar */
  search?: ReactNode;
  /** Right side - typically BatchActions (auto-dims when falsy) */
  actions?: ReactNode;
  /** Center content - filters, toggles, etc. */
  children?: ReactNode;
}

export default function Toolbar({ search, actions, children }: ToolbarProps) {
  return (
    <div className="vr-table-toolbar">
      <div className="vr-table-toolbar-left">
        {search}
      </div>
      {children && (
        <div className="vr-table-toolbar-center">
          {children}
        </div>
      )}
      <div className="vr-table-toolbar-right" data-active={!!actions}>
        {actions}
      </div>
    </div>
  );
}
