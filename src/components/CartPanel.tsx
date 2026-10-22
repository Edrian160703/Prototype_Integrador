import type { MouseEvent } from 'react'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { crearReservasDesdeCarrito } from '../services/reservaService'

interface CartPanelProps {
  open: boolean
  onClose: () => void
}

export default function CartPanel({ open, onClose }: CartPanelProps) {
  const { items, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart()
  const { user } = useAuth()
  const [comprando, setComprando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleComprar = async () => {
    if (!user) {
      setError('Tenés que iniciar sesión para reservar.')
      return
    }

    setError(null)
    setComprando(true)
    try {
      await crearReservasDesdeCarrito(user.uid, user.email ?? '', items)
      clearCart()
      onClose()
    } catch (err) {
      console.error('Error al registrar la reserva', err)
      setError(err instanceof Error ? err.message : 'No se pudo registrar la reserva. Intentá de nuevo.')
    } finally {
      setComprando(false)
    }
  }

  return (
    <div className="cart-overlay" onClick={handleOverlayClick}>
      <div className="cart-panel">
        <div className="cart-panel-head">
          <strong>Carrito de compras</strong>
          <button className="modal-close" aria-label="Cerrar" onClick={onClose}>×</button>
        </div>

        {items.length === 0 ? (
          <p className="cart-empty">Todavía no agregaste ninguna reserva.</p>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    {item.image ? <img src={item.image} alt={item.title} /> : null}
                  </div>
                  <div className="cart-item-info">
                    <span className="cart-item-title">{item.title}</span>
                    <div className="cart-item-stepper">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Restar unidad"
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxStock}
                        aria-label="Sumar unidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">S/ {(item.price * item.quantity).toFixed(2)}</div>
                  <button
                    type="button"
                    className="cart-item-remove"
                    aria-label="Quitar del carrito"
                    onClick={() => removeFromCart(item.id)}
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-panel-footer">
              <span>Total</span>
              <strong>S/ {totalPrice.toFixed(2)}</strong>
            </div>
            {error && <p className="cart-error">{error}</p>}
            <button
              type="button"
              className="btn btn-primary btn-block cart-checkout-btn"
              onClick={handleComprar}
              disabled={comprando}
            >
              {comprando ? 'Reservando…' : 'Reservar'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
