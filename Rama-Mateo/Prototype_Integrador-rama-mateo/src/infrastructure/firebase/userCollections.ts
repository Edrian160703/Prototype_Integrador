import type { UserRole } from '../../types/user'

export type UserCollectionName = 'consumidores' | 'comercios'

const USER_COLLECTION_BY_ROLE: Record<UserRole, UserCollectionName> = {
  consumer: 'consumidores',
  store: 'comercios',
}

export const USER_COLLECTION_NAMES = Object.values(USER_COLLECTION_BY_ROLE)

export function getUserCollectionName(role: UserRole): UserCollectionName {
  return USER_COLLECTION_BY_ROLE[role]
}
