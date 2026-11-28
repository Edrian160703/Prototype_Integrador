import { describe, expect, it } from 'vitest'
import { createReadableIdGenerator } from '../../src/infrastructure/readableIdGenerator'

const base = { next: () => '21af1f23-c4d9-40d4-b078-92c5bdc1923d' }

describe('createReadableIdGenerator', () => {
  it('combina el nombre normalizado con el inicio del id generado', () => {
    expect(createReadableIdGenerator(base).next('Queque de vainilla')).toBe('queque_de_vainilla_21af1f23')
  })
  it('antepone el prefijo indicado', () => {
    expect(createReadableIdGenerator(base, 'ofertas').next('Panes Dulces')).toBe('ofertas_panes_dulces_21af1f23')
  })
  it('arma el ID de compra como COMPRA_<nombre>_<id>', () => {
    expect(createReadableIdGenerator(base, 'COMPRA').next('Mario')).toBe('COMPRA_mario_21af1f23')
  })
  it('quita tildes y símbolos', () => {
    expect(createReadableIdGenerator(base).next('Ñoquis / Café')).toBe('noquis_cafe_21af1f23')
  })
  it('usa un nombre genérico si el nombre queda vacío', () => {
    expect(createReadableIdGenerator(base).next('***')).toBe('sin_nombre_21af1f23')
  })
})
