import type { AuthIdentity } from '../ports/authGateway'
import type { AccountStatus, ManagedAccount } from '../ports/accountRepository'
import type { CreateOfertaParams, OfertaConComercio, OfertaPayload, OwnedOferta } from '../types/oferta'
import type { ProductoEstado, ProductoPayload } from '../types/producto'
import type { InitialUserData, InitialUserProfile, UserDocument, UserRole } from '../types/user'
import type { CartItem } from '../types/cart'
import type { CheckoutRequest } from '../types/checkout'
import type { EstadoReserva, ReservaConOferta, ReservaDocument } from '../types/reserva'
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
  getOfertasVigentes(): Promise<OfertaConComercio[]>
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
  crearReservasDesdeCarrito(
    idUsuario: string,
    emailUsuario: string,
    items: CartItem[],
    nombreUsuario?: string | null,
  ): Promise<string[]>
  confirmarCheckout(
    idUsuario: string,
    emailUsuario: string,
    items: CartItem[],
    request: CheckoutRequest,
    nombreUsuario?: string | null,
  ): Promise<string[]>
}

export interface ReservationManagementApplication {
  cancelarReserva(idReserva: string): Promise<void>
}

export interface ReservationAdminApplication {
  getAllReservasForAdmin(): Promise<ReservaDocument[]>
  updateReservaEstado(idReserva: string, estado: EstadoReserva): Promise<void>
  deleteReserva(idReserva: string): Promise<void>
}

export interface ReservationHistoryApplication {
  getReservasByUsuario(idUsuario: string): Promise<ReservaConOferta[]>
}

export interface ReservationAdminApplication {
  getAllReservasForAdmin(): Promise<ReservaDocument[]>
  updateReservaEstado(idReserva: string, estado: EstadoReserva): Promise<void>
  deleteReservaForAdmin(idReserva: string): Promise<void>
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

export interface SignupStartApplication {
  startEmailSignup(input: {
    email: string
    password: string
    role: UserRole
    profile?: InitialUserProfile
  }): void
  startGoogleSignup(role: UserRole, profile?: InitialUserProfile): Promise<AuthIdentity>
}

export interface PendingSignupQueryApplication {
  getPendingSignupRole(): UserRole | null
}

export interface SignupCompletionApplication {
  completeSignup(profile: InitialUserProfile): Promise<AuthIdentity>
  cancelSignup(): Promise<void>
}

export interface EmailSignInApplication {
  signInWithEmail(email: string, password: string): Promise<AuthIdentity>
}

export interface GoogleSignInApplication {
  loginWithGoogle(): Promise<AuthIdentity>
}

export interface AdminClaimQueryApplication {
  hasAdminClaim(): Promise<boolean>
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
  ReservationHistoryApplication,
  ReservationAdminApplication {}

export interface AuthenticationApplication extends
  CurrentUserQueryApplication,
  AuthStateSubscriptionApplication,
  AuthRegistrationApplication,
  SignupStartApplication,
  PendingSignupQueryApplication,
  SignupCompletionApplication,
  EmailSignInApplication,
  GoogleSignInApplication,
  AdminClaimQueryApplication,
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
  ReservaDocument,
}
