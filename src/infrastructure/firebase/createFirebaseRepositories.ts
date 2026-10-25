import { assertFirebaseAdmin, getFirebaseFirestore } from './firebaseClient'
import { createLazyRepository } from '../createLazyRepository'
import { createCryptoIdGenerator } from '../cryptoIdGenerator'
import { createReadableIdGenerator } from '../readableIdGenerator'
import type { IdGenerator } from '../../ports/idGenerator'

export function createFirebaseRepositories(idGenerator: IdGenerator = createCryptoIdGenerator()) {
  const productIds = createReadableIdGenerator(idGenerator)
  const reservationIds = createReadableIdGenerator(idGenerator, 'reserva')

  const products = createLazyRepository(async () => {
    const [{ FirebaseProductoRepository }, db] = await Promise.all([
      import('./FirebaseProductoRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseProductoRepository(db, productIds)
  })

  const offers = createLazyRepository(async () => {
    const [{ FirebaseOfertaRepository }, db] = await Promise.all([
      import('./FirebaseOfertaRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseOfertaRepository(db, idGenerator)
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
    return new FirebaseReservaRepository(
      db,
      idGenerator,
      { assertAdmin: assertFirebaseAdmin },
      reservationIds,
    )
  })

  const accounts = createLazyRepository(async () => {
    const [{ FirebaseAccountRepository }, db] = await Promise.all([
      import('./FirebaseAccountRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseAccountRepository(db, { assertAdmin: assertFirebaseAdmin })
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
