import { useState } from 'react'
import useAdminAccounts from './useAdminAccounts'
import useAdminProducts from './useAdminProducts'
import useAdminReservations from './useAdminReservations'

export type AdminTab = 'usuarios' | 'comercios' | 'productos' | 'reservas'

export default function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios')
  const accounts = useAdminAccounts()
  const products = useAdminProducts()
  const reservations = useAdminReservations()

  return {
    activeTab,
    setActiveTab,
    users: accounts.users,
    stores: accounts.stores,
    products: products.products,
    reservations: reservations.reservations,
    loadError: [accounts.loadError, products.loadError, reservations.loadError]
      .filter(Boolean)
      .join(' ') || null,
    handleUserStatusChange: accounts.handleUserStatusChange,
    handleUserDelete: accounts.handleUserDelete,
    handleStoreStatusChange: accounts.handleStoreStatusChange,
    handleStoreDelete: accounts.handleStoreDelete,
    handleProductStatusChange: products.handleProductStatusChange,
    handleProductDelete: products.handleProductDelete,
    handleReservationStatusChange: reservations.handleReservationStatusChange,
    handleReservationDelete: reservations.handleReservationDelete,
  }
}
