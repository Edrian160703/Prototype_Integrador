import { getFirebaseFirestore } from './firebaseClient'
import { createLazyRepository } from '../createLazyRepository'

export function createFirebaseRepositories() {
  const products = createLazyRepository(async () => {
    const [{ FirebaseProductoRepository }, db] = await Promise.all([
      import('./FirebaseProductoRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseProductoRepository(db)
  })

  const offers = createLazyRepository(async () => {
    const [{ FirebaseOfertaRepository }, db] = await Promise.all([
      import('./FirebaseOfertaRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseOfertaRepository(db)
  })

  const commerces = createLazyRepository(async () => {
    const [{ FirebaseComercioRepository }, db] = await Promise.all([
      import('./FirebaseComercioRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseComercioRepository(db)
  })

  const reservations = createLazyRepository(async () => {
    const [{ FirebaseReservaRepository }, db] = await Promise.all([
      import('./FirebaseReservaRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseReservaRepository(db)
  })

  const accounts = createLazyRepository(async () => {
    const [{ FirebaseAccountRepository }, db] = await Promise.all([
      import('./FirebaseAccountRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseAccountRepository(db)
  })

  const userProfiles = createLazyRepository(async () => {
    const [{ FirebaseUserProfileRepository }, db] = await Promise.all([
      import('./FirebaseUserProfileRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseUserProfileRepository(db)
  })

  return { products, offers, commerces, reservations, accounts, userProfiles }
}
