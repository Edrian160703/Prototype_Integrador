import type { AuthIdentity } from '../ports/authGateway'
import type { AccountStatus, ManagedAccount } from '../ports/accountRepository'
import type { CreateOfertaParams, OfertaConComercio, OfertaPayload, OwnedOferta } from '../types/oferta'
import type { ProductoEstado, ProductoPayload } from '../types/producto'
import type { InitialUserData, InitialUserProfile, UserDocument, UserRole } from '../types/user'
import type { CartItem } from '../types/cart'
import type { ReservaConOferta } from '../types/reserva'
import type { ProductoAdminRecord } from '../types/productoAdmin'
import type { ProductoDocument } from '../types/producto'

export interface ProductCatalogApplication {
  createProducto(uid: string, payload: ProductoPayload): Promise<string>
  getProductosByComercio(idComercio: string): Promise<ProductoDocument[]>
  getProductoById(idProducto: string): Promise<ProductoDocument | null>
}

export interface ProductAdminQueryApplication {
  getAllProductosForAdmin(): Promise<ProductoAdminRecord[]>
}

export interface ProductManagementApplication {
  updateProductoEstado(idProducto: string, estado: ProductoEstado): Promise<void>
  deleteProducto(idProducto: string): Promise<void>
}

export interface OfferListQueryApplication {
  getOfertas(): Promise<OfertaConComercio[]>
}

export interface OfferDetailsQueryApplication {
  getOfertaById(idOferta: string): Promise<OfertaConComercio | null>
}

export interface OfferOwnerQueryApplication {
  getOfertasByOwner(uid: string): Promise<OwnedOferta[]>
}

export interface OfferEditingApplication {
  updateOferta(id: string, uid: string, payload: Omit<OfertaPayload, 'estado'>): Promise<void>
  deleteOferta(id: string, uid: string): Promise<void>
}

export interface OfferCreationApplication {
  createOferta(params: CreateOfertaParams): Promise<string>
}

export interface OfferPublishingApplication {
  createOfertaConProducto(params: CreateOfertaParams): Promise<string>
}

export interface AccountQueryApplication {
  listUsers(): Promise<ManagedAccount[]>
  listStores(): Promise<ManagedAccount[]>
}

export interface AccountManagementApplication {
  setAccountStatus(id: string, role: UserRole, status: AccountStatus): Promise<void>
  deleteAccountDocument(id: string, role: UserRole): Promise<void>
}

export interface ReservationCheckoutApplication {
  crearReservasDesdeCarrito(idUsuario: string, emailUsuario: string, items: CartItem[]): Promise<string[]>
}

export interface ReservationManagementApplication {
  cancelarReserva(idReserva: string): Promise<void>
}

export interface ReservationHistoryApplication {
  getReservasByUsuario(idUsuario: string): Promise<ReservaConOferta[]>
}

export interface CurrentUserQueryApplication {
  getCurrentUser(): AuthIdentity | null
}

export interface AuthStateSubscriptionApplication {
  subscribeToAuthChanges(listener: (user: AuthIdentity | null) => void): () => void
}

export interface UserProfileQueryApplication {
  getUserDocument(uid: string): Promise<UserDocument | null>
}

export interface AuthRegistrationApplication {
  registerWithEmail(
    email: string,
    password: string,
    role: UserRole,
    profile?: InitialUserData['profile'],
  ): Promise<AuthIdentity>
  signInWithGoogle(role: UserRole, profile?: InitialUserData['profile']): Promise<AuthIdentity>
}

export interface EmailSignInApplication {
  signInWithEmail(email: string, password: string): Promise<AuthIdentity>
}

export interface GoogleSignInApplication {
  loginWithGoogle(): Promise<AuthIdentity>
}

export interface SignOutApplication {
  signOutUser(): Promise<void>
}

export interface ProfileOnboardingApplication {
  updateUserProfile(uid: string, role: UserRole, profile: InitialUserProfile): Promise<void>
}

export interface ProfileEditingApplication {
  saveProfileChanges(
    uid: string,
    role: UserRole,
    profile: InitialUserProfile,
    displayName: string | null,
  ): Promise<void>
}

export interface ProductApplication extends
  ProductCatalogApplication,
  ProductAdminQueryApplication,
  ProductManagementApplication {}

export interface OfferApplication extends
  OfferListQueryApplication,
  OfferDetailsQueryApplication,
  OfferOwnerQueryApplication,
  OfferEditingApplication,
  OfferCreationApplication,
  OfferPublishingApplication {}

export interface AccountApplication extends
  AccountQueryApplication,
  AccountManagementApplication {}

export interface ReservationApplication extends
  ReservationCheckoutApplication,
  ReservationManagementApplication,
  ReservationHistoryApplication {}

export interface AuthenticationApplication extends
  CurrentUserQueryApplication,
  AuthStateSubscriptionApplication,
  AuthRegistrationApplication,
  EmailSignInApplication,
  GoogleSignInApplication,
  SignOutApplication {}

export interface UserProfileApplication extends
  UserProfileQueryApplication,
  ProfileOnboardingApplication,
  ProfileEditingApplication {}

export interface ApplicationServices {
  products: ProductApplication
  offers: OfferApplication
  accounts: AccountApplication
  reservations: ReservationApplication
  authentication: AuthenticationApplication
  userProfiles: UserProfileApplication
}

export type {
  AccountStatus,
  AuthIdentity,
  ManagedAccount,
  OfertaConComercio,
  OwnedOferta,
  ProductoAdminRecord,
  ReservaConOferta,
}
