/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - CRUD Actions                                       │
│  /src/vr/actions/Crud.tsx                                       │
│                                                                         │
│  Standard CRUD action icons: Edit + Delete                             │
│  VR renders icons, page provides behavior via props.                   │
└─────────────────────────────────────────────────────────────────────────┘ */

import { Icon } from '@/vr';

import { Tooltip } from '@/vr';

export interface CrudActionsProps<TRow = Record<string, unknown>> {
  row: TRow;
  onEdit?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;
  disableEdit?: boolean | ((row: TRow) => boolean);
  disableDelete?: boolean | ((row: TRow) => boolean);
  // Smart tooltip behavior - VR handles tooltip rendering
  editTooltip?: string | ((row: TRow) => string);
  deleteTooltip?: string | ((row: TRow) => string);
  tooltipSize?: 'sm' | 'md' | 'lg';
}

export default function CrudActions<TRow = Record<string, unknown>>({
  row,
  onEdit,
  onDelete,
  disableEdit,
  disableDelete,
  editTooltip,
  deleteTooltip,
  tooltipSize = 'sm'
}: CrudActionsProps<TRow>) {
  // VR Convention: DUMB - Feature provides all business logic via props
  const editDisabled = typeof disableEdit === 'function' ? disableEdit(row) : disableEdit;
  const deleteDisabled = typeof disableDelete === 'function' ? disableDelete(row) : disableDelete;

  // Feature provides tooltip text via props
  const editTooltipText = typeof editTooltip === 'function'
    ? editTooltip(row)
    : editTooltip || (editDisabled ? "Cannot edit" : "Edit");

  const deleteTooltipText = typeof deleteTooltip === 'function'
    ? deleteTooltip(row)
    : deleteTooltip || (deleteDisabled ? "Cannot delete" : "Delete");

  const editIcon = (
    <span
      onClick={() => !editDisabled && onEdit?.(row)}
      data-disabled={editDisabled || undefined}
    >
      <Icon variant="pencil" size="xs" />
    </span>
  );

  const deleteIcon = (
    <span
      onClick={() => !deleteDisabled && onDelete?.(row)}
      data-disabled={deleteDisabled || undefined}
    >
      <Icon variant="trash" size="xs" />
    </span>
  );

  return (
    <>
      <Tooltip.caret content={editTooltipText} size={tooltipSize}>
        {editIcon}
      </Tooltip.caret>
      <Tooltip.caret content={deleteTooltipText} size={tooltipSize}>
        {deleteIcon}
      </Tooltip.caret>
    </>
  );
}
