import type { InitialUserData, InitialUserProfile, UserDocument, UserRole } from '../types/user'

export interface UserProfileReader {
  getById(uid: string): Promise<UserDocument | null>
}

export interface IProfileCreator {
  createIfMissing(
    user: { uid: string; email: string; displayName: string | null; photoURL: string | null },
    data: Omit<InitialUserData, 'uid' | 'email'>,
  ): Promise<void>
}

export interface IProfileUpdater {
  updateOnboarding(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void>
  saveChanges(
    uid: string,
    role: UserRole,
    profile: InitialUserProfile,
    displayName: string | null,
  ): Promise<void>
}
