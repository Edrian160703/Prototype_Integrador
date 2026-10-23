import { getFirebaseFirestore } from './firebaseClient'
import { createLazyRepository } from '../createLazyRepository'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import type { IdGenerator } from '../../ports/idGenerator'

export function createFirebaseRepositories(idGenerator: IdGenerator = createCryptoIdGenerator()) {
  const products = createLazyRepository(async () => {
    const [{ FirebaseProductoRepository }, db] = await Promise.all([
      import('./FirebaseProductoRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseProductoRepository(db, idGenerator)
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
    return new FirebaseReservaRepository(db, idGenerator)
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
