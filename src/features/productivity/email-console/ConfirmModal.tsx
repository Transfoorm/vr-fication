'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <>
      <div className="ft-email__modal-backdrop" onClick={onCancel} />
      <div className="ft-email__modal">
        <div className="ft-email__modal-title">{title}</div>
        <div className="ft-email__modal-message">{message}</div>
        <div className="ft-email__modal-actions">
          <button className="ft-email__modal-btn ft-email__modal-btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="ft-email__modal-btn ft-email__modal-btn--confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
