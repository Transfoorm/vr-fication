/**──────────────────────────────────────────────────────────────────────┐
│  🤖 VARIANT ROBOT - Modal Component Registry                           │
│  /src/components/prebuilts/modal/index.tsx                             │
│                                                                        │
│  Central dispatcher for all modal variants.                            │
│  Each variant is a first-class, autonomous component.                  │
│                                                                        │
│  Usage:                                                                │
│  import { Modal } from '@/prebuilts/modal';                            │
│                                                                        │
│  <Modal.dialogue title="..." isOpen={true} onClose={...} />            │
│  <Modal.alert title="..." message="..." isOpen={true} />               │
│  <Modal.confirmation title="..." onConfirm={...} />                    │
└────────────────────────────────────────────────────────────────────────┘ */

// Import consolidated modal styles

// Centered modals (overlays)
import DialogueModal from './Dialogue';
import AlertModal from './Alert';
import ConfirmationModal from './Confirmation';
import VerifyModal from './Verify';

// Drawer (side modal)
export { SideDrawerProvider, useSideDrawer, SideDrawerPortal } from './SideDrawerContext';

// Sheet (bottom modal) - PLACEHOLDER
// 🚧 Future implementation - see Sheet.tsx
// export { BottomSheetProvider, useBottomSheet } from './Sheet';

/**
 * Modal Registry - All modal variants as named exports
 *
 * Architecture benefits:
 * ✅ Each variant evolves independently
 * ✅ No conditional rendering mess
 * ✅ Tree-shakeable - unused modals aren't bundled
 * ✅ Testable in isolation
 * ✅ Self-documenting structure
 * ✅ AI/CLI friendly: "Give me an alert modal" → Modal.alert
 *
 * Taxonomy:
 * • centered/ - Centered overlay modals (dialogue, alert, confirmation)
 * • drawer/   - Side modals that slide from right
 * • sheet/    - Bottom modals that slide from bottom (future)
 */
export const Modal = {
  dialogue: DialogueModal,
  alert: AlertModal,
  confirmation: ConfirmationModal,
  verify: VerifyModal,
} as const;

// Export individual components for direct import if needed
export {
  DialogueModal,
  AlertModal,
  ConfirmationModal,
  VerifyModal
};

// Type exports for TypeScript users
export type { DialogueModalProps } from './Dialogue';
export type { AlertModalProps } from './Alert';
export type { ConfirmationModalProps } from './Confirmation';
export type { VerifyModalProps } from './Verify';

// Helper type for variant names
export type ModalVariant = keyof typeof Modal;
