import { useState } from 'react'
import useAdminAccounts from './useAdminAccounts'
import useAdminProducts from './useAdminProducts'

export type AdminTab = 'usuarios' | 'comercios' | 'productos'

export default function useAdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios')
  const accounts = useAdminAccounts()
  const products = useAdminProducts()

  return {
    activeTab,
    setActiveTab,
    users: accounts.users,
    stores: accounts.stores,
    products: products.products,
    loadError: [accounts.loadError, products.loadError].filter(Boolean).join(' ') || null,
    handleUserStatusChange: accounts.handleUserStatusChange,
    handleUserDelete: accounts.handleUserDelete,
    handleStoreStatusChange: accounts.handleStoreStatusChange,
    handleStoreDelete: accounts.handleStoreDelete,
    handleProductStatusChange: products.handleProductStatusChange,
    handleProductDelete: products.handleProductDelete,
  }
}
