import type {
  ConsumerUser,
  PickupSchedule,
  StoreUser,
  UserDocument,
  UserRole,
} from '../../types/user'
import { toDate } from './firestoreDates'
import type { UserCollectionName } from './userCollections'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(value: unknown, field: string, uid: string): string {
  if (typeof value !== 'string') {
    throw new TypeError(`El campo "${field}" del perfil ${uid} debe ser texto.`)
  }
  return value
}

function optionalString(value: unknown, field: string, uid: string): string | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string') {
    throw new TypeError(`El campo "${field}" del perfil ${uid} debe ser texto.`)
  }
  return value
}

function nullableString(value: unknown, field: string, uid: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string') {
    throw new TypeError(`El campo "${field}" del perfil ${uid} debe ser texto o null.`)
  }
  return value
}

function optionalStringArray(value: unknown, field: string, uid: string): string[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new TypeError(`El campo "${field}" del perfil ${uid} debe ser una lista de textos.`)
  }
  return value
}

function optionalCoordinates(
  latitude: unknown,
  longitude: unknown,
  uid: string,
): { latitude?: number; longitude?: number } {
  if (latitude === undefined && longitude === undefined) return {}
  if (
    typeof latitude !== 'number'
    || !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || typeof longitude !== 'number'
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    throw new TypeError(`Las coordenadas del perfil ${uid} deben ser un par de números válidos.`)
  }
  return { latitude, longitude }
}

function mapPickupSchedule(value: unknown, uid: string): PickupSchedule[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) {
    throw new TypeError(`El horario de recojo del perfil ${uid} debe ser una lista.`)
  }

  return value.map((schedule, index) => {
    if (!isRecord(schedule)) {
      throw new TypeError(`El horario ${index + 1} del perfil ${uid} no es válido.`)
    }
    return {
      day: requiredString(schedule.day, `pickupSchedule[${index}].day`, uid),
      startTime: requiredString(schedule.startTime, `pickupSchedule[${index}].startTime`, uid),
      endTime: requiredString(schedule.endTime, `pickupSchedule[${index}].endTime`, uid),
    }
  })
}

function mapRole(value: unknown, uid: string, collectionName: UserCollectionName): UserRole {
  const collectionRole: UserRole = collectionName === 'consumidores' ? 'consumer' : 'store'
  if (value !== collectionRole) {
    throw new TypeError(`El rol del perfil ${uid} no coincide con su colección "${collectionName}".`)
  }
  return collectionRole
}

export function mapUserProfileDocument(
  uid: string,
  collectionName: UserCollectionName,
  data: Record<string, unknown>,
): UserDocument {
  const role = mapRole(data.role, uid, collectionName)
  const email = requiredString(data.email, 'email', uid)
  const displayName = nullableString(data.displayName, 'displayName', uid)
  const photoURL = nullableString(data.photoURL, 'photoURL', uid)
  if (typeof data.onboardingCompleted !== 'boolean') {
    throw new TypeError(`El campo "onboardingCompleted" del perfil ${uid} debe ser booleano.`)
  }

  const common = {
    uid,
    email,
    displayName,
    photoURL,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    onboardingCompleted: data.onboardingCompleted,
  }

  if (role === 'consumer') {
    return {
      ...common,
      role,
      firstName: optionalString(data.firstName, 'firstName', uid),
      lastName: optionalString(data.lastName, 'lastName', uid),
      dni: optionalString(data.dni, 'dni', uid),
      phone: optionalString(data.phone, 'phone', uid),
      district: optionalString(data.district, 'district', uid),
      habitualLocation: optionalString(data.habitualLocation, 'habitualLocation', uid),
      dietaryPreferences: optionalStringArray(data.dietaryPreferences, 'dietaryPreferences', uid),
    } satisfies ConsumerUser
  }

  const verificationStatus = data.verificationStatus
  if (
    verificationStatus !== undefined
    && verificationStatus !== 'pending'
    && verificationStatus !== 'verified'
    && verificationStatus !== 'rejected'
  ) {
    throw new TypeError(`El estado de verificación del perfil ${uid} no es válido.`)
  }

  return {
    ...common,
    role,
    businessName: optionalString(data.businessName, 'businessName', uid),
    ruc: optionalString(data.ruc, 'ruc', uid),
    phone: optionalString(data.phone, 'phone', uid),
    address: optionalString(data.address, 'address', uid),
    district: optionalString(data.district, 'district', uid),
    reference: optionalString(data.reference, 'reference', uid),
    ...optionalCoordinates(data.latitude, data.longitude, uid),
    pickupSchedule: mapPickupSchedule(data.pickupSchedule, uid),
    businessCategory: optionalString(data.businessCategory, 'businessCategory', uid),
    verificationStatus,
  } satisfies StoreUser
}
