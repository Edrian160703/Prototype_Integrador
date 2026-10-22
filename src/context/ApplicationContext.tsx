import { createContext, useContext, type Context, type ReactNode } from 'react'
import type {
  AccountApplication,
  AccountManagementApplication,
  AccountQueryApplication,
  ApplicationServices,
  AuthenticationApplication,
  AuthRegistrationApplication,
  AuthStateSubscriptionApplication,
  CurrentUserQueryApplication,
  EmailSignInApplication,
  GoogleSignInApplication,
  OfferApplication,
  OfferCreationApplication,
  OfferDetailsQueryApplication,
  OfferEditingApplication,
  OfferListQueryApplication,
  OfferOwnerQueryApplication,
  OfferPublishingApplication,
  ProductAdminQueryApplication,
  ProductApplication,
  ProductCatalogApplication,
  ProductManagementApplication,
  ProfileEditingApplication,
  ProfileOnboardingApplication,
  ReservationApplication,
  ReservationCheckoutApplication,
  ReservationHistoryApplication,
  ReservationManagementApplication,
  SignOutApplication,
  UserProfileApplication,
  UserProfileQueryApplication,
} from '../application/contracts'

const ProductContext = createContext<ProductApplication | null>(null)
const OfferContext = createContext<OfferApplication | null>(null)
const AccountContext = createContext<AccountApplication | null>(null)
const ReservationContext = createContext<ReservationApplication | null>(null)
const AuthenticationContext = createContext<AuthenticationApplication | null>(null)
const UserProfileContext = createContext<UserProfileApplication | null>(null)

export function ApplicationProvider({
  application,
  children,
}: {
  application: ApplicationServices
  children: ReactNode
}) {
  return (
    <ProductContext.Provider value={application.products}>
      <OfferContext.Provider value={application.offers}>
        <AccountContext.Provider value={application.accounts}>
          <ReservationContext.Provider value={application.reservations}>
            <AuthenticationContext.Provider value={application.authentication}>
              <UserProfileContext.Provider value={application.userProfiles}>
                {children}
              </UserProfileContext.Provider>
            </AuthenticationContext.Provider>
          </ReservationContext.Provider>
        </AccountContext.Provider>
      </OfferContext.Provider>
    </ProductContext.Provider>
  )
}

function useRequiredApplication<T>(context: Context<T | null>, name: string): T {
  const application = useContext(context)
  if (!application) throw new Error(`${name} must be used within an ApplicationProvider.`)
  return application
}

function useProducts(): ProductApplication {
  return useRequiredApplication(ProductContext, 'A product application hook')
}

function useOffers(): OfferApplication {
  return useRequiredApplication(OfferContext, 'An offer application hook')
}

function useAccounts(): AccountApplication {
  return useRequiredApplication(AccountContext, 'An account application hook')
}

function useReservations(): ReservationApplication {
  return useRequiredApplication(ReservationContext, 'A reservation application hook')
}

function useAuthentication(): AuthenticationApplication {
  return useRequiredApplication(AuthenticationContext, 'An authentication application hook')
}

function useUserProfiles(): UserProfileApplication {
  return useRequiredApplication(UserProfileContext, 'A user profile application hook')
}

export function useProductCatalog(): ProductCatalogApplication {
  return useProducts()
}

export function useProductAdminQuery(): ProductAdminQueryApplication {
  return useProducts()
}

export function useProductManagement(): ProductManagementApplication {
  return useProducts()
}

export function useOfferListQuery(): OfferListQueryApplication {
  return useOffers()
}

export function useOfferDetailsQuery(): OfferDetailsQueryApplication {
  return useOffers()
}

export function useOfferOwnerQuery(): OfferOwnerQueryApplication {
  return useOffers()
}

export function useOfferEditing(): OfferEditingApplication {
  return useOffers()
}

export function useOfferCreation(): OfferCreationApplication {
  return useOffers()
}

export function useOfferPublishing(): OfferPublishingApplication {
  return useOffers()
}

export function useAccountQuery(): AccountQueryApplication {
  return useAccounts()
}

export function useAccountManagement(): AccountManagementApplication {
  return useAccounts()
}

export function useReservationCheckout(): ReservationCheckoutApplication {
  return useReservations()
}

export function useReservationManagement(): ReservationManagementApplication {
  return useReservations()
}

export function useReservationHistory(): ReservationHistoryApplication {
  return useReservations()
}

export function useCurrentUserQuery(): CurrentUserQueryApplication {
  return useAuthentication()
}

export function useAuthStateSubscription(): AuthStateSubscriptionApplication {
  return useAuthentication()
}

export function useUserProfileQuery(): UserProfileQueryApplication {
  return useUserProfiles()
}

export function useAuthRegistration(): AuthRegistrationApplication {
  return useAuthentication()
}

export function useEmailSignIn(): EmailSignInApplication {
  return useAuthentication()
}

export function useGoogleSignIn(): GoogleSignInApplication {
  return useAuthentication()
}

export function useSignOut(): SignOutApplication {
  return useAuthentication()
}

export function useProfileOnboarding(): ProfileOnboardingApplication {
  return useUserProfiles()
}

export function useProfileEditing(): ProfileEditingApplication {
  return useUserProfiles()
}
