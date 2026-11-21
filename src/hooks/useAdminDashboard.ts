import { useState } from 'react'
import useAdminAccounts from './useAdminAccounts'
import useAdminProducts from './useAdminProducts'
import useAdminReservations from './useAdminReservations'
import useAdminOffers from './useAdminOffers'

export type AdminTab = 'usuarios' | 'comercios' | 'productos' | 'reservas' | 'ofertas'

export default function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios')
  const accounts = useAdminAccounts()
  const products = useAdminProducts()
  const reservations = useAdminReservations()
  const offers = useAdminOffers()

  return {
    activeTab,
    setActiveTab,
    users: accounts.users,
    stores: accounts.stores,
    products: products.products,
    reservations: reservations.reservations,
    offers: offers.offers,
    loadError: [accounts.loadError, products.loadError, reservations.loadError, offers.loadError].filter(Boolean).join(' ') || null,
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
