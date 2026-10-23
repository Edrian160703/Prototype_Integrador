import type { InitialUserProfile } from '../../types/user'

export interface NewUserDocumentInput {
  uid: string
  displayName: string | null
  profile?: InitialUserProfile
}

/** Decide cómo se llama el documento de un usuario nuevo dentro de su colección. */
export interface UserDocumentIdStrategy {
  createId(input: NewUserDocumentInput): string
}

/** Comportamiento original: el ID del documento es el uid de Firebase Auth. */
export class UidDocumentIdStrategy implements UserDocumentIdStrategy {
  createId({ uid }: NewUserDocumentInput): string {
    return uid
  }
}

export const READABLE_ID_UID_LENGTH = 5
const READABLE_ID_MAX_NAME_LENGTH = 60
const READABLE_ID_FALLBACK_NAME = 'consumidor'

function toSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function readNames(input: NewUserDocumentInput): string {
  const { profile, displayName } = input
  const parts = profile && 'firstName' in profile ? [profile.firstName, profile.lastName] : []
  const fromProfile = parts.filter(Boolean).join(' ')
  return fromProfile || displayName || ''
}

/** Ej.: Alex Perez + uid "PhQft0D8..." -> "alex_perez_phqft". El sufijo del uid evita duplicados. */
export class ReadableNameDocumentIdStrategy implements UserDocumentIdStrategy {
  constructor(private readonly uidLength: number = READABLE_ID_UID_LENGTH) {}

  createId(input: NewUserDocumentInput): string {
    const name = toSlug(readNames(input)).slice(0, READABLE_ID_MAX_NAME_LENGTH).replace(/_+$/, '')
    const suffix = toSlug(input.uid).slice(0, this.uidLength)
    return [name || READABLE_ID_FALLBACK_NAME, suffix].join('_')
  }
}
