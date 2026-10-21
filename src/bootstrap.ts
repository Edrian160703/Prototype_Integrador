import { createAccountServices } from './composition/createAccountServices'
import { createIdentityServices } from './composition/createIdentityServices'
import { createOfferServices } from './composition/createOfferServices'
import { createProductServices } from './composition/createProductServices'
import { createReservationServices } from './composition/createReservationServices'
import type { ApplicationServices } from './application/contracts'
import { FirebaseAuthGateway } from './infrastructure/firebase/FirebaseAuthGateway'
import { createFirebaseRepositories } from './infrastructure/firebase/createFirebaseRepositories'
import { getFirebaseAuth } from './infrastructure/firebase/firebaseClient'

export function createFoodBackApplication(): ApplicationServices {
  const repositories = createFirebaseRepositories()
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
    }),
    accounts: createAccountServices(repositories.accounts),
    reservations: createReservationServices({
      reservations: repositories.reservations,
      offers: repositories.offers,
    }),
    ...createIdentityServices({
      auth: authGateway,
      profiles: repositories.userProfiles,
    }),
  }
}
