import { createContext, useContext, type ReactNode } from 'react'
import type {
  AccountManagementApplication,
  AccountQueryApplication,
  AuthStateSubscriptionApplication,
  AuthRegistrationApplication,
  CurrentUserQueryApplication,
  EmailSignInApplication,
  FoodBackApplication,
  GoogleSignInApplication,
  OfferCreationApplication,
  OfferDetailsQueryApplication,
  OfferEditingApplication,
  OfferListQueryApplication,
  OfferOwnerQueryApplication,
  OfferPublishingApplication,
  ProductAdminQueryApplication,
  ProductCatalogApplication,
  ProductManagementApplication,
  ProfileEditingApplication,
  ProfileOnboardingApplication,
  ReservationCheckoutApplication,
  ReservationHistoryApplication,
  ReservationManagementApplication,
  SignOutApplication,
  UserProfileQueryApplication,
} from '../application/contracts'

const ApplicationContext = createContext<FoodBackApplication | null>(null)

export function ApplicationProvider({
  application,
  children,
}: {
  application: FoodBackApplication
  children: ReactNode
}) {
  return (
    <ApplicationContext.Provider value={application}>
      {children}
    </ApplicationContext.Provider>
  )
}

function useApplication(): FoodBackApplication {
  const application = useContext(ApplicationContext)
  if (!application) throw new Error('useApplication must be used within an ApplicationProvider.')
  return application
}

export function useProductCatalog(): ProductCatalogApplication {
  return useApplication()
}

export function useProductAdminQuery(): ProductAdminQueryApplication {
  return useApplication()
}

export function useProductManagement(): ProductManagementApplication {
  return useApplication()
}

export function useOfferListQuery(): OfferListQueryApplication {
  return useApplication()
}

export function useOfferDetailsQuery(): OfferDetailsQueryApplication {
  return useApplication()
}

export function useOfferOwnerQuery(): OfferOwnerQueryApplication {
  return useApplication()
}

export function useOfferEditing(): OfferEditingApplication {
  return useApplication()
}

export function useOfferCreation(): OfferCreationApplication {
  return useApplication()
}

export function useOfferPublishing(): OfferPublishingApplication {
  return useApplication()
}

export function useAccountQuery(): AccountQueryApplication {
  return useApplication()
}

export function useAccountManagement(): AccountManagementApplication {
  return useApplication()
}

export function useReservationCheckout(): ReservationCheckoutApplication {
  return useApplication()
}

export function useReservationManagement(): ReservationManagementApplication {
  return useApplication()
}

export function useReservationHistory(): ReservationHistoryApplication {
  return useApplication()
}

export function useCurrentUserQuery(): CurrentUserQueryApplication {
  return useApplication()
}

export function useAuthStateSubscription(): AuthStateSubscriptionApplication {
  return useApplication()
}

export function useUserProfileQuery(): UserProfileQueryApplication {
  return useApplication()
}

export function useAuthRegistration(): AuthRegistrationApplication {
  return useApplication()
}

export function useEmailSignIn(): EmailSignInApplication {
  return useApplication()
}

export function useGoogleSignIn(): GoogleSignInApplication {
  return useApplication()
}

export function useSignOut(): SignOutApplication {
  return useApplication()
}

export function useProfileOnboarding(): ProfileOnboardingApplication {
  return useApplication()
}

export function useProfileEditing(): ProfileEditingApplication {
  return useApplication()
}
