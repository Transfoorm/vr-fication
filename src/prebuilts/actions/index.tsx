/**──────────────────────────────────────────────────────────────────────┐
│  🤖 ACTIONS - Central Export                                           │
│  /src/prebuilts/actions/index.tsx                                      │
│                                                                         │
│  Virgin VR action variants for table columns.                          │
│                                                                         │
│  Usage:                                                                │
│  { key: 'actions', header: 'Actions', variant: 'crud' }                │
│                                                                         │
│  Available variants:                                                   │
│  - crud: Edit + Delete                                                 │
│  - view: View + Delete                                                 │
│  - document: View + Email + Delete                                     │
│  - admin: Edit + Delete + Flag                                         │
└────────────────────────────────────────────────────────────────────────┘ */


import CrudActions from './Crud';
import ViewActions from './View';
import DocumentActions from './Document';
import AdminActions from './Admin';
import ActionPillComponent from './ActionPill';

export const Actions = {
  crud: CrudActions,
  view: ViewActions,
  document: DocumentActions,
  admin: AdminActions,
};

// Standalone action components
export const ActionPill = ActionPillComponent;
export type { ActionPillProps } from './ActionPill';
