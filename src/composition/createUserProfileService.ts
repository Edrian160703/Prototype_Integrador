import {
  getUserDocument,
  saveProfileChanges,
  updateUserProfile,
} from '../application/userProfiles'
import type { UserProfileApplication } from '../application/contracts'
import type {
  IAuthProfileUpdater,
  IAuthSession,
} from '../ports/authGateway'
import type {
  IOnboardingProfileWriter,
  IProfileEditor,
  UserProfileReader,
} from '../ports/userProfileRepository'
import type { InitialUserProfile, UserRole } from '../types/user'

type ProfileRepository =
  & UserProfileReader
  & IOnboardingProfileWriter
  & IProfileEditor

interface UserProfileServiceDependencies {
  authSession: IAuthSession
  authProfileUpdater: IAuthProfileUpdater
  profiles: () => Promise<ProfileRepository>
}

export function createUserProfileService({
  authSession,
  authProfileUpdater,
  profiles,
}: UserProfileServiceDependencies): UserProfileApplication {
  return {
    getUserDocument: async (uid) => getUserDocument(await profiles(), uid),
    updateUserProfile: async (
      uid: string,
      role: UserRole,
      profile: InitialUserProfile,
    ) => updateUserProfile(await profiles(), uid, role, profile),
    saveProfileChanges: async (
      uid: string,
      role: UserRole,
      profile: InitialUserProfile,
      displayName: string | null,
    ) => saveProfileChanges(
      authSession,
      authProfileUpdater,
      await profiles(),
      uid,
      role,
      profile,
      displayName,
    ),
  }
}
