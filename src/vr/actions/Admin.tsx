/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Admin Actions                                      │
│  /src/prebuilts/actions/Admin.tsx                                      │
│                                                                         │
│  Admin action icons: Edit + Delete + Flag                              │
│  VR renders icons, page provides behavior via props.                   │
└─────────────────────────────────────────────────────────────────────────┘ */

import { Icon } from '@/vr';

export interface AdminActionsProps<TRow = Record<string, unknown>> {
  row: TRow;
  onEdit?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;
  onFlag?: (row: TRow) => void;
}

export default function AdminActions<TRow = Record<string, unknown>>({ row, onEdit, onDelete, onFlag }: AdminActionsProps<TRow>) {
  return (
    <>
      <span
        title="Edit"
        onClick={() => onEdit?.(row)}
      >
        <Icon variant="pencil" size="xs" />
      </span>
      <span
        title="Delete"
        onClick={() => onDelete?.(row)}
      >
        <Icon variant="trash" size="xs" />
      </span>
      <span
        title="Flag user"
        onClick={() => onFlag?.(row)}
      >
        <Icon variant="flag" size="xs" />
      </span>
    </>
  );
}
