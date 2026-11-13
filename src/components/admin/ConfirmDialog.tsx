import ReactDOM from 'react-dom'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel: string
  variant?: 'primary' | 'danger'
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  variant = 'primary',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const root = document.getElementById('root') ?? document.body

  return ReactDOM.createPortal(
    <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog-card">
        <div className="confirm-dialog-header">
          <h3 className="confirm-dialog-title">{title}</h3>
          <button type="button" className="confirm-dialog-close" onClick={onCancel} aria-label="Cerrar">✕</button>
        </div>
        <p className="confirm-dialog-body">{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" className="confirm-dialog-action confirm-dialog-action-secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className={`confirm-dialog-action ${variant === 'danger' ? 'confirm-dialog-action-danger' : 'confirm-dialog-action-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    root,
  )
}
