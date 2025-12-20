/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Document Actions                                   │
│  /src/prebuilts/actions/Document.tsx                                   │
│                                                                         │
│  Document action icons: View + Email + Delete                          │
│  VR renders icons, page provides behavior via props.                   │
└─────────────────────────────────────────────────────────────────────────┘ */

import { Icon } from '@/vr';

export interface DocumentActionsProps<TRow = Record<string, unknown>> {
  row: TRow;
  onView?: (row: TRow) => void;
  onEmail?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;
}

export default function DocumentActions<TRow = Record<string, unknown>>({ row, onView, onEmail, onDelete }: DocumentActionsProps<TRow>) {
  return (
    <>
      <span
        title="View details"
        onClick={() => onView?.(row)}
      >
        <Icon variant="search" size="xs" />
      </span>
      <span
        title="Email"
        onClick={() => onEmail?.(row)}
      >
        <Icon variant="mail" size="xs" />
      </span>
      <span
        title="Delete"
        onClick={() => onDelete?.(row)}
      >
        <Icon variant="trash" size="xs" />
      </span>
    </>
  );
}
