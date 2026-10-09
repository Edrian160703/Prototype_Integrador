import {
  createOferta as createOfertaUseCase,
  createOfertaConProducto as createOfertaConProductoUseCase,
  deleteOferta as deleteOfertaUseCase,
  getOfertaById as getOfertaByIdUseCase,
  getOfertas as getOfertasUseCase,
  getOfertasByOwner as getOfertasByOwnerUseCase,
  updateOferta as updateOfertaUseCase,
} from './application/ofertas'
import {
  createProducto as createProductoUseCase,
  deleteProducto as deleteProductoUseCase,
  getAllProductosForAdmin as getAllProductosForAdminUseCase,
  getProductoById as getProductoByIdUseCase,
  getProductosByComercio as getProductosByComercioUseCase,
  updateProductoEstado as updateProductoEstadoUseCase,
} from './application/productos'
import { listAccounts, setAccountStatus as setAccountStatusUseCase, deleteAccountDocument as deleteAccountUseCase } from './application/accounts'
import {
  getCurrentUser as getCurrentUserUseCase,
  getUserDocument as getUserDocumentUseCase,
  loginWithGoogle as loginWithGoogleUseCase,
  registerWithEmail as registerWithEmailUseCase,
  saveProfileChanges as saveProfileChangesUseCase,
  signInWithEmail as signInWithEmailUseCase,
  signInWithGoogle as signInWithGoogleUseCase,
  signOutUser as signOutUserUseCase,
  subscribeToAuthChanges as subscribeToAuthChangesUseCase,
  updateUserProfile as updateUserProfileUseCase,
} from './application/auth'
import {
  cancelarReserva as cancelarReservaUseCase,
  crearReservasDesdeCarrito as crearReservasDesdeCarritoUseCase,
  getReservasByUsuario as getReservasByUsuarioUseCase,
} from './application/reservas'
import { FirebaseAuthGateway } from './infrastructure/firebase/FirebaseAuthGateway'
import type { CreateOfertaParams } from './types/oferta'
import type { CartItem } from './types/cart'
import type { OfertaPayload } from './types/oferta'
import type { ProductoEstado, ProductoPayload } from './types/producto'
import type { ProductoAdminRecord } from './types/productoAdmin'
import type { UserRole } from './types/user'
import type { AccountStatus } from './ports/accountRepository'
import type { AuthIdentity } from './ports/authGateway'
import type { InitialUserData, InitialUserProfile } from './types/user'
import type { ReservaConOferta } from './types/reserva'
import type { FoodBackApplication } from './application/contracts'
import { getFirebaseAuth, getFirebaseFirestore } from './infrastructure/firebase/firebaseClient'

function lazyRepository<T>(factory: () => Promise<T>): () => Promise<T> {
  let repository: Promise<T> | undefined
  return () => {
    repository ??= factory()
    return repository
  }
}

export function createFoodBackApplication(): FoodBackApplication {
  const authGateway = new FirebaseAuthGateway(getFirebaseAuth())
  const productoRepository = lazyRepository(async () => {
    const [{ FirebaseProductoRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseProductoRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseProductoRepository(db)
  })
  const ofertaRepository = lazyRepository(async () => {
    const [{ FirebaseOfertaRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseOfertaRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseOfertaRepository(db)
  })
  const comercioRepository = lazyRepository(async () => {
    const [{ FirebaseComercioRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseComercioRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseComercioRepository(db)
  })
  const reservaRepository = lazyRepository(async () => {
    const [{ FirebaseReservaRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseReservaRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseReservaRepository(db)
  })
  const accountRepository = lazyRepository(async () => {
    const [{ FirebaseAccountRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseAccountRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseAccountRepository(db)
  })
  const userProfileRepository = lazyRepository(async () => {
    const [{ FirebaseUserProfileRepository }, db] = await Promise.all([
      import('./infrastructure/firebase/FirebaseUserProfileRepository'),
      getFirebaseFirestore(),
    ])
    return new FirebaseUserProfileRepository(db)
  })

  async function createProducto(uid: string, payload: ProductoPayload): Promise<string> {
    return createProductoUseCase(await productoRepository(), { uid, payload })
  }

  async function getProductosByComercio(idComercio: string) {
    return getProductosByComercioUseCase(await productoRepository(), idComercio)
  }

  async function getProductoById(idProducto: string) {
    return getProductoByIdUseCase(await productoRepository(), idProducto)
  }

  async function updateProductoEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
    return updateProductoEstadoUseCase(await productoRepository(), idProducto, estado)
  }

  async function deleteProducto(idProducto: string): Promise<void> {
    return deleteProductoUseCase(await productoRepository(), idProducto)
  }

  async function getAllProductosForAdmin(): Promise<ProductoAdminRecord[]> {
    const [products, commerces] = await Promise.all([productoRepository(), comercioRepository()])
    return getAllProductosForAdminUseCase(products, commerces)
  }

  async function createOferta(params: CreateOfertaParams): Promise<string> {
    return createOfertaUseCase(await ofertaRepository(), params)
  }

  async function createOfertaConProducto(params: CreateOfertaParams): Promise<string> {
    const [products, offers] = await Promise.all([productoRepository(), ofertaRepository()])
    return createOfertaConProductoUseCase(params, products, offers)
  }

  async function getOfertas() {
    const [offers, commerces] = await Promise.all([ofertaRepository(), comercioRepository()])
    return getOfertasUseCase(offers, commerces)
  }

  async function getOfertaById(idOferta: string) {
    const [offers, commerces] = await Promise.all([ofertaRepository(), comercioRepository()])
    return getOfertaByIdUseCase(idOferta, offers, commerces)
  }

  async function getOfertasByOwner(uid: string) {
    return getOfertasByOwnerUseCase(await ofertaRepository(), uid)
  }

  async function updateOferta(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>) {
    return updateOfertaUseCase(await ofertaRepository(), id, uid, payload)
  }

  async function deleteOferta(id: string, uid: string) {
    return deleteOfertaUseCase(await ofertaRepository(), id, uid)
  }

  async function listUsers() {
    return listAccounts(await accountRepository(), 'consumer')
  }

  async function listStores() {
    return listAccounts(await accountRepository(), 'store')
  }

  async function setAccountStatus(id: string, role: UserRole, status: AccountStatus) {
    return setAccountStatusUseCase(await accountRepository(), id, role, status)
  }

  async function deleteAccountDocument(id: string, role: UserRole) {
    return deleteAccountUseCase(await accountRepository(), id, role)
  }

  async function crearReservasDesdeCarrito(idUsuario: string, emailUsuario: string, items: CartItem[]) {
    return crearReservasDesdeCarritoUseCase(await reservaRepository(), idUsuario, emailUsuario, items)
  }

  async function cancelarReserva(reserva: ReservaConOferta) {
    return cancelarReservaUseCase(await reservaRepository(), reserva)
  }

  async function getReservasByUsuario(idUsuario: string) {
    const [reservas, offers] = await Promise.all([reservaRepository(), ofertaRepository()])
    return getReservasByUsuarioUseCase(reservas, offers, idUsuario)
  }

  async function registerWithEmail(
    email: string,
    password: string,
    role: UserRole,
    profile: InitialUserData['profile'] = {},
  ): Promise<AuthIdentity> {
    return registerWithEmailUseCase(authGateway, await userProfileRepository(), email, password, role, profile)
  }

  async function signInWithGoogle(
    role: UserRole,
    profile: InitialUserData['profile'] = {},
  ): Promise<AuthIdentity> {
    return signInWithGoogleUseCase(authGateway, await userProfileRepository(), role, profile)
  }

  function signInWithEmail(email: string, password: string): Promise<AuthIdentity> {
    return signInWithEmailUseCase(authGateway, email, password)
  }

  async function loginWithGoogle(): Promise<AuthIdentity> {
    return loginWithGoogleUseCase(authGateway, await userProfileRepository())
  }

  function signOutUser(): Promise<void> {
    return signOutUserUseCase(authGateway)
  }

  function getCurrentUser(): AuthIdentity | null {
    return getCurrentUserUseCase(authGateway)
  }

  function subscribeToAuthChanges(listener: (user: AuthIdentity | null) => void): () => void {
    return subscribeToAuthChangesUseCase(authGateway, listener)
  }

  async function getUserDocument(uid: string) {
    return getUserDocumentUseCase(await userProfileRepository(), uid)
  }

  async function updateUserProfile(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void> {
    return updateUserProfileUseCase(await userProfileRepository(), uid, role, profile)
  }

  async function saveProfileChanges(
    uid: string,
    role: UserRole,
    profile: InitialUserProfile,
    displayName: string | null,
  ): Promise<void> {
    return saveProfileChangesUseCase(
      authGateway,
      authGateway,
      await userProfileRepository(),
      uid,
      role,
      profile,
      displayName,
    )
  }

  return {
    createProducto,
    getProductosByComercio,
    getProductoById,
    updateProductoEstado,
    deleteProducto,
    getAllProductosForAdmin,
    createOferta,
    createOfertaConProducto,
    getOfertas,
    getOfertaById,
    getOfertasByOwner,
    updateOferta,
    deleteOferta,
    listUsers,
    listStores,
    setAccountStatus,
    deleteAccountDocument,
    crearReservasDesdeCarrito,
    cancelarReserva,
    getReservasByUsuario,
    registerWithEmail,
    signInWithGoogle,
    signInWithEmail,
    loginWithGoogle,
    signOutUser,
    getCurrentUser,
    subscribeToAuthChanges,
    getUserDocument,
    updateUserProfile,
    saveProfileChanges,
  }
}
