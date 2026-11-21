import type { AccountReader, AccountStatus, AccountWriter, ManagedAccount } from '../ports/accountRepository'
import type { UserRole } from '../types/user'

function getTimestampValue(date: Date | null | undefined): number {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return 0
  return date.getTime()
}

export function listAccounts(repository: AccountReader, role: UserRole): Promise<ManagedAccount[]> {
  return repository.listByRole(role).then((accounts) =>
    [...accounts].sort((left, right) => getTimestampValue(right.createdAt) - getTimestampValue(left.createdAt)))
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
