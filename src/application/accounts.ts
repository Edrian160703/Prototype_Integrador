import type { AccountReader, AccountStatus, AccountWriter, ManagedAccount } from '../ports/accountRepository'
import type { UserRole } from '../types/user'

export function listAccounts(repository: AccountReader, role: UserRole): Promise<ManagedAccount[]> {
  return repository.listByRole(role)
}

export function setAccountStatus(
  repository: AccountWriter,
  id: string,
  role: UserRole,
  status: AccountStatus,
): Promise<void> {
  return repository.setStatus(id, role, status)
}

export function deleteAccountDocument(repository: AccountWriter, id: string, role: UserRole): Promise<void> {
  return repository.delete(id, role)
}
