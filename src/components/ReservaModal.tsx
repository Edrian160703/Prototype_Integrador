import type { MouseEvent } from 'react'

interface ReservaModalProps {
  open: boolean
  onClose: () => void
  image?: string
  title: string
  place: string
  distance: string
  price: string
}

export default function ReservaModal({ open, onClose, image, title, place, distance, price }: ReservaModalProps) {
  if (!open) return null

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay reserva-overlay" onClick={handleOverlayClick}>
      <div className="reserva-window">
        <button className="modal-close reserva-window-close" aria-label="Cerrar" onClick={onClose}>×</button>

        <div className="reserva-window-media">
          {image ? (
            <img src={image} alt={title} />
          ) : (
            <div className="reserva-window-media-placeholder" />
          )}
        </div>

        <div className="reserva-window-info">
          <div className="reserva-window-header">
            <span className="reserva-window-eyebrow">Reserva</span>
            <h2>{title}</h2>
            <div className="reserva-window-place">
              <span>{place}</span>
              <span>📍 {distance}</span>
            </div>
            <div className="reserva-window-price">S/ {price}</div>
          </div>

          <div className="reserva-window-body" />

          <div className="reserva-window-footer" />
        </div>
      </div>
    </div>
  )
}
