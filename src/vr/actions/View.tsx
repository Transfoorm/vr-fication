/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - View Actions                                       │
│  /src/prebuilts/actions/View.tsx                                       │
│                                                                         │
│  Read-only action icons: View + Delete                                 │
│  VR renders icons, page provides behavior via props.                   │
└─────────────────────────────────────────────────────────────────────────┘ */

import { Icon } from '@/vr';
import { Tooltip } from '@/vr';

export interface ViewActionsProps<TRow = Record<string, unknown>> {
  row: TRow;
  onView?: (row: TRow) => void;
  onDelete?: (row: TRow) => void;
  disableView?: boolean | ((row: TRow) => boolean);
  disableDelete?: boolean | ((row: TRow) => boolean);
  // Smart tooltip behavior - VR handles tooltip rendering
  viewTooltip?: string | ((row: TRow) => string);
  deleteTooltip?: string | ((row: TRow) => string);
  tooltipSize?: 'sm' | 'md' | 'lg';
}

export default function ViewActions<TRow = Record<string, unknown>>({
  row,
  onView,
  onDelete,
  disableView,
  disableDelete,
  viewTooltip,
  deleteTooltip,
  tooltipSize = 'sm'
}: ViewActionsProps<TRow>) {
  // VR Convention: DUMB - Feature provides all business logic via props
  const viewDisabled = typeof disableView === 'function' ? disableView(row) : disableView;
  const deleteDisabled = typeof disableDelete === 'function' ? disableDelete(row) : disableDelete;

  // Feature provides tooltip text via props
  const viewTooltipText = typeof viewTooltip === 'function'
    ? viewTooltip(row)
    : viewTooltip || (viewDisabled ? "Cannot view" : "View details");

  const deleteTooltipText = typeof deleteTooltip === 'function'
    ? deleteTooltip(row)
    : deleteTooltip || (deleteDisabled ? "Cannot delete" : "Delete");

  const viewIcon = (
    <span
      onClick={() => !viewDisabled && onView?.(row)}
      data-disabled={viewDisabled || undefined}
    >
      <Icon variant="search" size="xs" />
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
      <Tooltip.caret content={viewTooltipText} size={tooltipSize}>
        {viewIcon}
      </Tooltip.caret>
      <Tooltip.caret content={deleteTooltipText} size={tooltipSize}>
        {deleteIcon}
      </Tooltip.caret>
    </>
  );
}
