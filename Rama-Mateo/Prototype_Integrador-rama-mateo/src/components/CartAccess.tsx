import { lazy, Suspense, useState } from 'react'
import { useCartCount } from '../context/CartContext'
import { useUserProfile } from '../context/AuthContext'

const CartPanel = lazy(() => import('./CartPanel'))

export default function CartAccess() {
  const { totalItems } = useCartCount()
  const { profile } = useUserProfile()
  const [cartOpen, setCartOpen] = useState(false)

  if (profile?.role === 'store') return null

  return (
    <>
      <button
        className="cart-fab"
        aria-label="Carrito de compras"
        onClick={() => setCartOpen(true)}
      >
        🛒
        {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
      </button>
      {cartOpen && (
        <Suspense fallback={null}>
          <CartPanel open onClose={() => setCartOpen(false)} />
        </Suspense>
      )}
    </>
  )
}
