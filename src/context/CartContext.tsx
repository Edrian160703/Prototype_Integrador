import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { CartItem } from '../types/cart'

interface CartContextValue {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity: number) => void
  updateQuantity: (id: string, quantity: number) => void
  removeFromCart: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue>({
  items: [],
  totalItems: 0,
  totalPrice: 0,
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
})

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

  const value = useMemo(
    () => ({ items, totalItems, totalPrice, addToCart, updateQuantity, removeFromCart, clearCart }),
    [items, totalItems, totalPrice, addToCart, updateQuantity, removeFromCart, clearCart],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  return useContext(CartContext)
}
