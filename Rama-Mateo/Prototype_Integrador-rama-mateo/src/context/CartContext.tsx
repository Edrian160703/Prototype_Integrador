import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '../types/cart'

interface CartSummary {
  items: CartItem[]
  totalPrice: number
}

interface CartCount {
  totalItems: number
}

interface CartAddition {
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void
}

interface CartManagement {
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
}

const CartSummaryContext = createContext<CartSummary | null>(null)
const CartCountContext = createContext<CartCount | null>(null)
const CartAdditionContext = createContext<CartAddition | null>(null)
const CartManagementContext = createContext<CartManagement | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = useCallback((item: Omit<CartItem, 'quantity'>, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, existing.maxStock)
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: nextQuantity } : i))
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }]
    })
  }, [])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i)),
    )
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items])
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.price, 0), [items])

  const summary = useMemo(() => ({ items, totalPrice }), [items, totalPrice])
  const count = useMemo(() => ({ totalItems }), [totalItems])
  const addition = useMemo(() => ({ addToCart }), [addToCart])
  const management = useMemo(
    () => ({ updateQuantity, removeFromCart, clearCart }),
    [updateQuantity, removeFromCart, clearCart],
  )

  return (
    <CartSummaryContext.Provider value={summary}>
      <CartCountContext.Provider value={count}>
        <CartAdditionContext.Provider value={addition}>
          <CartManagementContext.Provider value={management}>
            {children}
          </CartManagementContext.Provider>
        </CartAdditionContext.Provider>
      </CartCountContext.Provider>
    </CartSummaryContext.Provider>
  )
}

export function useCartSummary(): CartSummary {
  const context = useContext(CartSummaryContext)
  if (!context) throw new Error('useCartSummary must be used within a CartProvider.')
  return context
}

export function useCartCount(): CartCount {
  const context = useContext(CartCountContext)
  if (!context) throw new Error('useCartCount must be used within a CartProvider.')
  return context
}

export function useAddToCart(): CartAddition {
  const context = useContext(CartAdditionContext)
  if (!context) throw new Error('useAddToCart must be used within a CartProvider.')
  return context
}

export function useCartManagement(): CartManagement {
  const context = useContext(CartManagementContext)
  if (!context) throw new Error('useCartManagement must be used within a CartProvider.')
  return context
}
