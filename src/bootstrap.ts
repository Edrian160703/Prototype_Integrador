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
import { listAccounts, setAccountStatus as setAccountStatusUseCase, deleteAccountDocument as deleteAccountUseCase } from './services/accounts'
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
} from './services/authService'
import {
  cancelarReserva as cancelarReservaUseCase,
  crearReservasDesdeCarrito as crearReservasDesdeCarritoUseCase,
  getReservasByUsuario as getReservasByUsuarioUseCase,
  type ReservaConOferta,
} from './services/reservaService'
import { FirebaseAccountRepository } from './infrastructure/firebase/FirebaseAccountRepository'
import { FirebaseAuthGateway } from './infrastructure/firebase/FirebaseAuthGateway'
import { FirebaseComercioRepository } from './infrastructure/firebase/FirebaseComercioRepository'
import { FirebaseOfertaRepository } from './infrastructure/firebase/FirebaseOfertaRepository'
import { FirebaseProductoRepository } from './infrastructure/firebase/FirebaseProductoRepository'
import { FirebaseReservaRepository } from './infrastructure/firebase/FirebaseReservaRepository'
import { FirebaseUserProfileRepository } from './infrastructure/firebase/FirebaseUserProfileRepository'
import { toOfferCardData, toOfertaDetalle, type OfertaDetalle, type OfferCardData } from './presentation/OfertaPresenter'
import { toProductoAdminItems } from './presentation/ProductoPresenter'
import type { CreateOfertaParams } from './services/ofertaService'
import type { CartItem } from './types/cart'
import type { OfertaPayload } from './types/oferta'
import type { ProductoEstado, ProductoPayload } from './types/producto'
import type { ProductoAdminItem } from './types/productoAdmin'
import type { UserRole } from './types/user'
import type { AccountStatus } from './ports/accountRepository'
import type { AuthIdentity } from './ports/authGateway'
import type { InitialUserData, InitialUserProfile } from './types/user'

const productoRepository = new FirebaseProductoRepository()
const ofertaRepository = new FirebaseOfertaRepository()
const comercioRepository = new FirebaseComercioRepository()
const reservaRepository = new FirebaseReservaRepository()
const accountRepository = new FirebaseAccountRepository()
const authGateway = new FirebaseAuthGateway()
const userProfileRepository = new FirebaseUserProfileRepository()

export function createProducto(uid: string, payload: ProductoPayload): Promise<string> {
  return createProductoUseCase(productoRepository, { uid, payload })
}

export function getProductosByComercio(idComercio: string) {
  return getProductosByComercioUseCase(productoRepository, idComercio)
}

export function getProductoById(idProducto: string) {
  return getProductoByIdUseCase(productoRepository, idProducto)
}

export function updateProductoEstado(idProducto: string, estado: ProductoEstado): Promise<void> {
  return updateProductoEstadoUseCase(productoRepository, idProducto, estado)
}

export function deleteProducto(idProducto: string): Promise<void> {
  return deleteProductoUseCase(productoRepository, idProducto)
}

export async function getAllProductosForAdmin(): Promise<ProductoAdminItem[]> {
  const records = await getAllProductosForAdminUseCase(productoRepository)
  return toProductoAdminItems(records)
}

export function createOferta(params: CreateOfertaParams): Promise<string> {
  return createOfertaUseCase(ofertaRepository, params)
}

export function createOfertaConProducto(params: CreateOfertaParams): Promise<string> {
  return createOfertaConProductoUseCase(params, productoRepository, ofertaRepository)
}

export async function getOfertas(): Promise<OfferCardData[]> {
  const offers = await getOfertasUseCase(ofertaRepository, comercioRepository)
  return offers.map(toOfferCardData)
}

export async function getOfertaById(idOferta: string): Promise<OfertaDetalle | null> {
  const offer = await getOfertaByIdUseCase(idOferta, ofertaRepository, comercioRepository)
  return offer ? toOfertaDetalle(offer) : null
}

export function getOfertasByOwner(uid: string) {
  return getOfertasByOwnerUseCase(ofertaRepository, uid)
}

export function updateOferta(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>) {
  return updateOfertaUseCase(ofertaRepository, id, uid, payload)
}

export function deleteOferta(id: string, uid: string) {
  return deleteOfertaUseCase(ofertaRepository, id, uid)
}

export function listUsers() {
  return listAccounts(accountRepository, 'consumer')
}

export function listStores() {
  return listAccounts(accountRepository, 'store')
}

export function setAccountStatus(id: string, role: UserRole, status: AccountStatus) {
  return setAccountStatusUseCase(accountRepository, id, role, status)
}

export function deleteAccountDocument(id: string, role: UserRole) {
  return deleteAccountUseCase(accountRepository, id, role)
}

export function crearReservasDesdeCarrito(idUsuario: string, emailUsuario: string, items: CartItem[]) {
  return crearReservasDesdeCarritoUseCase(reservaRepository, idUsuario, emailUsuario, items)
}

export function cancelarReserva(reserva: ReservaConOferta) {
  return cancelarReservaUseCase(reservaRepository, reserva)
}

export function getReservasByUsuario(idUsuario: string) {
  return getReservasByUsuarioUseCase(reservaRepository, ofertaRepository, idUsuario)
}

export function registerWithEmail(
  email: string,
  password: string,
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<AuthIdentity> {
  return registerWithEmailUseCase(authGateway, userProfileRepository, email, password, role, profile)
}

export function signInWithGoogle(
  role: UserRole,
  profile: InitialUserData['profile'] = {},
): Promise<AuthIdentity> {
  return signInWithGoogleUseCase(authGateway, userProfileRepository, role, profile)
}

export function signInWithEmail(email: string, password: string): Promise<AuthIdentity> {
  return signInWithEmailUseCase(authGateway, email, password)
}

export function loginWithGoogle(): Promise<AuthIdentity> {
  return loginWithGoogleUseCase(authGateway, userProfileRepository)
}

export function signOutUser(): Promise<void> {
  return signOutUserUseCase(authGateway)
}

export function getCurrentUser(): AuthIdentity | null {
  return getCurrentUserUseCase(authGateway)
}

export function subscribeToAuthChanges(listener: (user: AuthIdentity | null) => void): () => void {
  return subscribeToAuthChangesUseCase(authGateway, listener)
}

export function getUserDocument(uid: string) {
  return getUserDocumentUseCase(userProfileRepository, uid)
}

export function updateUserProfile(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void> {
  return updateUserProfileUseCase(userProfileRepository, uid, role, profile)
}

export function saveProfileChanges(
  uid: string,
  role: UserRole,
  profile: InitialUserProfile,
  displayName: string | null,
): Promise<void> {
  return saveProfileChangesUseCase(
    authGateway,
    authGateway,
    userProfileRepository,
    uid,
    role,
    profile,
    displayName,
  )
}
