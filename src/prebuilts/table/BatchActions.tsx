/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Table Batch Actions                                 │
│  /src/prebuilts/table/BatchActions.tsx                                  │
│                                                                         │
│  Selection pill + delete button. Hard-wired visibility.                 │
│  Zero layout shift - always rendered, opacity controlled.               │
│                                                                         │
│  Usage:                                                                 │
│  <Table.batchActions                                                    │
│    selectedCount={checkedRows.size}                                     │
│    onDelete={handleBatchDelete}                                         │
│    label="user/users"                                                   │
│  />                                                                     │
└─────────────────────────────────────────────────────────────────────────┘ */

import { Button } from '@/prebuilts';

export interface BatchActionsProps {
  /** Number of selected items */
  selectedCount: number;
  /** Handler for delete action */
  onDelete: () => void;
  /** Singular/plural label (e.g., "user/users", "item/items") */
  label?: string;
}

export default function BatchActions({
  selectedCount,
  onDelete,
  label = 'item/items'
}: BatchActionsProps) {
  const [singular, plural] = label.split('/');
  const isActive = selectedCount > 0;

  return (
    <div className={`vr-batch-actions ${isActive ? 'vr-batch-active' : ''}`}>
      <span className="vr-selection-pill">
        {selectedCount} {selectedCount === 1 ? singular : plural} selected
      </span>
      <Button.danger onClick={onDelete} disabled={!isActive}>
        Delete Selected
      </Button.danger>
    </div>
  );
}
