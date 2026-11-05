import type { UserRole } from '../types/user'

export type AccountStatus = 'activa' | 'suspendida' | 'pendiente'

export interface ManagedAccount {
  id: string
  role: UserRole
  displayName: string
  email: string
  status: AccountStatus
  createdAt: Date
  lastActiveAt: Date
}

export interface AccountReader {
  listByRole(role: UserRole): Promise<ManagedAccount[]>
}

export interface AccountWriter {
  setStatus(id: string, role: UserRole, status: AccountStatus): Promise<void>
  delete(id: string, role: UserRole): Promise<void>
}
