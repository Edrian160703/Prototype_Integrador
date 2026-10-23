import { useEffect, useState } from 'react'
import {
  useAccountManagement,
  useAccountQuery,
} from '../context/ApplicationContext'
import type { AccountStatus, ManagedAccount } from '../application/contracts'

export default function useAdminAccounts() {
  const { listUsers, listStores } = useAccountQuery()
  const { setAccountStatus, deleteAccountDocument } = useAccountManagement()
  const [users, setUsers] = useState<ManagedAccount[] | null>(null)
  const [stores, setStores] = useState<ManagedAccount[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadAccounts() {
      try {
        const [usersData, storesData] = await Promise.all([listUsers(), listStores()])
        if (active) {
          setUsers(usersData)
          setStores(storesData)
        }
      } catch (error) {
        console.error('No se pudieron cargar las cuentas del panel administrativo.', error)
        if (active) setLoadError('No pudimos cargar las cuentas desde Firestore.')
      }
    }

    void loadAccounts()
    return () => {
      active = false
    }
  }, [listStores, listUsers])

  return {
    users,
    stores,
    loadError,
    handleUserStatusChange: (id: string, status: AccountStatus) =>
      setAccountStatus(id, 'consumer', status),
    handleUserDelete: (id: string) => deleteAccountDocument(id, 'consumer'),
    handleStoreStatusChange: (id: string, status: AccountStatus) =>
      setAccountStatus(id, 'store', status),
    handleStoreDelete: (id: string) => deleteAccountDocument(id, 'store'),
  }
}
