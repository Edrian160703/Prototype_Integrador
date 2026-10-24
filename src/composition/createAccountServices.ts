import {
  deleteAccountDocument,
  listAccounts,
  setAccountStatus,
} from '../application/accounts'
import type { AccountApplication } from '../application/contracts'
import type { AccountReader, AccountWriter, AccountStatus } from '../ports/accountRepository'
import type { UserRole } from '../types/user'

type AccountRepository = AccountReader & AccountWriter

export function createAccountServices(
  getRepository: () => Promise<AccountRepository>,
): AccountApplication {
  return {
    listUsers: async () => listAccounts(await getRepository(), 'consumer'),
    listStores: async () => listAccounts(await getRepository(), 'store'),
    setAccountStatus: async (id: string, role: UserRole, status: AccountStatus) =>
      setAccountStatus(await getRepository(), id, role, status),
    deleteAccountDocument: async (id: string, role: UserRole) =>
      deleteAccountDocument(await getRepository(), id, role),
  }
}
