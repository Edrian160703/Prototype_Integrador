import { describe, expect, it } from 'vitest'
import {
  ReadableNameDocumentIdStrategy,
  UidDocumentIdStrategy,
} from '../../src/infrastructure/firebase/userDocumentIds'

const UID = 'PhQft0D8LVa6D9zpC3PM2fg7egO2'

describe('ReadableNameDocumentIdStrategy', () => {
  const strategy = new ReadableNameDocumentIdStrategy()

  it('combina nombre, apellido y los 5 primeros caracteres del uid', () => {
    const id = strategy.createId({ uid: UID, displayName: null, profile: { firstName: 'Alex', lastName: 'Perez' } })
    expect(id).toBe('alex_perez_phqft')
  })
  it('quita tildes, espacios y símbolos', () => {
    const id = strategy.createId({ uid: UID, displayName: null, profile: { firstName: 'José Ñuñez', lastName: "O'Brien / Díaz" } })
    expect(id).toBe('jose_nunez_o_brien_diaz_phqft')
  })
  it('usa displayName si el perfil no trae nombres', () => {
    expect(strategy.createId({ uid: UID, displayName: 'Ana García', profile: {} })).toBe('ana_garcia_phqft')
  })
  it('usa un nombre genérico si no hay ningún dato', () => {
    expect(strategy.createId({ uid: UID, displayName: null })).toBe('consumidor_phqft')
  })
})

describe('UidDocumentIdStrategy', () => {
  it('conserva el uid como ID', () => {
    expect(new UidDocumentIdStrategy().createId({ uid: UID, displayName: null })).toBe(UID)
  })
})
