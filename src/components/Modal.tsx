import { createPortal } from 'react-dom'
import { AlertTriangle, Info } from 'lucide-react'

interface ModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel?: () => void
  danger?: boolean
}

export default function Modal({
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
  danger,
}: ModalProps) {
  return createPortal(
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <div className={`modal-icon ${danger ? 'danger' : ''}`}>
          {danger ? <AlertTriangle size={22} /> : <Info size={22} />}
        </div>
        <div className="modal-title">{title}</div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          {cancelLabel && (
            <button onClick={onCancel} className="btn btn-secondary">{cancelLabel}</button>
          )}
          <button onClick={onConfirm} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
