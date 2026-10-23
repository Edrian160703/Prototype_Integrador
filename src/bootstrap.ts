import { createAccountServices } from './composition/createAccountServices'
import { createAuthenticationService } from './composition/createAuthenticationService'
import { createOfferServices } from './composition/createOfferServices'
import { createProductServices } from './composition/createProductServices'
import { createReservationServices } from './composition/createReservationServices'
import { createUserProfileService } from './composition/createUserProfileService'
import type { ApplicationServices } from './application/contracts'
import { FirebaseAuthGateway } from './infrastructure/firebase/FirebaseAuthGateway'
import { createFirebaseRepositories } from './infrastructure/firebase/createFirebaseRepositories'
import { InMemorySignupDraftStore } from './infrastructure/InMemorySignupDraftStore'
import { createCryptoIdGenerator } from './infrastructure/cryptoIdGenerator'
import { getFirebaseAuth } from './infrastructure/firebase/firebaseClient'

export function createFoodBackApplication(): ApplicationServices {
  const idGenerator = createCryptoIdGenerator()
  const repositories = createFirebaseRepositories(idGenerator)
  const authGateway = new FirebaseAuthGateway(getFirebaseAuth())

  return {
    products: createProductServices({
      products: repositories.products,
      commerces: repositories.commerces,
    }),
    offers: createOfferServices({
      offers: repositories.offers,
      products: repositories.products,
      commerces: repositories.commerces,
      idGenerator,
    }),
    accounts: createAccountServices(repositories.accounts),
    reservations: createReservationServices({
      reservations: repositories.reservations,
      offers: repositories.offers,
    }),
    authentication: createAuthenticationService({
      auth: authGateway,
      profiles: repositories.userProfiles,
      signupDrafts: new InMemorySignupDraftStore(),
    }),
    userProfiles: createUserProfileService({
      authSession: authGateway,
      authProfileUpdater: authGateway,
      profiles: repositories.userProfiles,
    }),
  }
}
