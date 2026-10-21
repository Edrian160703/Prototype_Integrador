import type {
  IAuthProfileUpdater,
  IAuthSession,
} from '../ports/authGateway'
import type {
  IOnboardingProfileWriter,
  IProfileEditor,
  UserProfileReader,
} from '../ports/userProfileRepository'
import type { InitialUserProfile, UserDocument, UserRole } from '../types/user'

export function getUserDocument(
  profiles: UserProfileReader,
  uid: string,
): Promise<UserDocument | null> {
  return profiles.getById(uid)
}

export function updateUserProfile(
  profiles: IOnboardingProfileWriter,
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
): Promise<void> {
  return profiles.updateOnboarding(uid, role, profile)
}

export async function saveProfileChanges(
  authSession: IAuthSession,
  authProfileUpdater: IAuthProfileUpdater,
  profiles: IProfileEditor,
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
  displayName: string | null,
): Promise<void> {
  await profiles.saveChanges(uid, role, profile, displayName)
  if (displayName && authSession.currentUser?.uid === uid) {
    await authProfileUpdater.updateDisplayName(uid, displayName)
  }
}
