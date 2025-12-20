/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Action Card                                        │
│  /src/components/prebuilts/card/action/index.tsx                       │
│                                                                        │
│  Quick action buttons card. CTAs. Navigation shortcuts.                │
│  Uses ButtonVC robots for consistent styling across the app.          │
│                                                                        │
│  Usage:                                                                │
│  import { CardVC } from '@/vr/card';                │
│  <CardVC.action                                                       │
│    title="Quick Actions"                                              │
│    actions={[                                                         │
│      { label: 'Create New', onClick: handleCreate, primary: true }   │
│    ]}                                                                 │
│  />                                                                    │
└────────────────────────────────────────────────────────────────────────┘ */

import { ReactNode } from 'react';
import { Button } from '@/vr/button';
import { T } from '@/vr';

export interface ActionItem {
  label: string;
  onClick?: () => void;
  href?: string;
  primary?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link' | 'fire';
  disabled?: boolean;
  icon?: ReactNode;
}

export interface ActionCardProps {
  title?: string;
  actions: ActionItem[];
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * ActionCard - Quick actions and CTA card
 *
 * Features:
 * - Primary/secondary action hierarchy
 * - Vertical or horizontal button layout
 * - Icon support
 * - Disabled states
 * - Link or button behavior
 *
 * Perfect for:
 * - Quick action panels
 * - Call-to-action groups
 * - Navigation shortcuts
 * - Tool launchers
 * - Common task buttons
 */
export default function ActionCard({
  title = 'Quick Actions',
  actions,
  layout = 'vertical',
  className = ''
}: ActionCardProps) {
  const layoutClass = `layout-${layout}`;

  return (
    <div className={`vr-card vr-card-action ${layoutClass} ${className}`}>
      {title && (
        <T.body size="md" weight="medium" className="vr-card-action-title">
          {title}
        </T.body>
      )}

      <div className="vr-card-action-list">
        {actions.map((action, index) => {
          // Determine which Button Robot to use
          // Priority: variant prop > primary flag > default to ghost
          let ButtonComponent;
          if (action.variant) {
            ButtonComponent = Button[action.variant];
          } else if (action.primary) {
            ButtonComponent = Button.primary;
          } else {
            ButtonComponent = Button.ghost;
          }

          return (
            <ButtonComponent
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              icon={action.icon}
              iconPosition="left"
              fullWidth={layout === 'vertical'}
            >
              {action.label}
            </ButtonComponent>
          );
        })}
      </div>
    </div>
  );
}