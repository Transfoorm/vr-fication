/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - ActionPill                                        │
│  /src/prebuilts/actions/ActionPill.tsx                                │
│                                                                        │
│  Inline confirmation button with complete state machine:              │
│  - idle: Gray pill, shows label                                       │
│  - confirming: Orange pill, shows "Confirm" with nudge animation      │
│  - executing: Orange pill, shows "...ing" with typing animation       │
│                                                                        │
│  Click once → "Confirm?" (orange) → click again → execute             │
│  Click away → revert to idle                                          │
│                                                                        │
│  This is a COMPLETE behavioral unit - no state leaks to parent.       │
└────────────────────────────────────────────────────────────────────────┘ */

'use client';

import { useState, useCallback } from 'react';

type ActionPillState = 'idle' | 'confirming' | 'executing';

export interface ActionPillProps {
  /** Button label in idle state */
  label: string;
  /** Label shown during execution (e.g., "Swapping...") */
  executingLabel: string;
  /** Called when user confirms (second click) */
  onExecute: () => Promise<void>;
  /** Disable when another action is in progress */
  disabled?: boolean;
}

export default function ActionPill({
  label,
  executingLabel,
  onExecute,
  disabled = false,
}: ActionPillProps) {
  const [state, setState] = useState<ActionPillState>('idle');

  const handleClick = useCallback(async () => {
    if (disabled || state === 'executing') return;

    if (state === 'idle') {
      // First click - enter confirmation mode
      setState('confirming');
      return;
    }

    // Second click - execute
    setState('executing');
    try {
      await onExecute();
    } catch (err) {
      console.error(`ActionPill "${label}" failed:`, err);
    } finally {
      setState('idle');
    }
  }, [disabled, label, onExecute, state]);

  const handleBlur = useCallback(() => {
    // Cancel confirmation if user clicks away
    if (state === 'confirming') {
      setTimeout(() => setState('idle'), 150);
    }
  }, [state]);

  // ─────────────────────────────────────────────────────────────────────
  // Derived classes
  // ─────────────────────────────────────────────────────────────────────

  const pillClasses = [
    'ft-field-action-pill',
    state === 'executing' && 'ft-field-action-pill--active',
    state === 'confirming' && 'ft-field-action-pill--confirm',
  ].filter(Boolean).join(' ');

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  const getContent = () => {
    if (state === 'executing') {
      return <span className="ft-field-action-pill__typing">{executingLabel}</span>;
    }
    if (state === 'confirming') {
      return 'Confirm';
    }
    return label;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onBlur={handleBlur}
      disabled={disabled || state === 'executing'}
      className={pillClasses}
    >
      {getContent()}
    </button>
  );
}
