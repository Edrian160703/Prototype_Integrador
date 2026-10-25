import { describe, expect, it } from 'vitest'
import {
  CREATION_DATE_RANGES,
  matchesCreationDateRange,
} from '../../src/utils/adminDateFilter'

<<<<<<< HEAD
describe('filtro por fecha de creación del panel administrativo', () => {
  it('ofrece únicamente los seis rangos permitidos', () => {
    expect(CREATION_DATE_RANGES.map(({ label }) => label)).toEqual([
      'Última hora',
      'Último día',
      'Última semana',
      'Último mes',
      'Último año',
      'Todos',
    ])
  })

  it('filtra por horas, días y semanas de forma inclusiva', () => {
    const now = new Date('2026-10-21T12:00:00Z')

    expect(matchesCreationDateRange(new Date('2026-10-21T11:00:00Z'), 'ultima-hora', now)).toBe(true)
    expect(matchesCreationDateRange(new Date('2026-10-21T10:59:59Z'), 'ultima-hora', now)).toBe(false)
    expect(matchesCreationDateRange(new Date('2026-10-20T12:00:00Z'), 'ultimo-dia', now)).toBe(true)
    expect(matchesCreationDateRange(new Date('2026-10-14T12:00:00Z'), 'ultima-semana', now)).toBe(true)
    expect(matchesCreationDateRange(new Date('2026-10-21T12:00:01Z'), 'todos', now)).toBe(true)
  })

  it('resta meses y años del calendario sin desbordar el fin de mes', () => {
    const endOfMarch = new Date('2025-03-31T12:00:00Z')

    expect(
      matchesCreationDateRange(new Date('2025-02-28T12:00:00Z'), 'ultimo-mes', endOfMarch),
    ).toBe(true)
    expect(
      matchesCreationDateRange(new Date('2025-02-27T12:00:00Z'), 'ultimo-mes', endOfMarch),
    ).toBe(false)
    expect(
      matchesCreationDateRange(
        new Date('2024-03-31T12:00:00Z'),
        'ultimo-ano',
        new Date('2025-03-31T12:00:00Z'),
      ),
    ).toBe(true)
=======
describe('filtro por fecha de creación administrativa', () => {
  it('expone los seis rangos previstos', () => {
    expect(CREATION_DATE_RANGES.map(({ value }) => value)).toEqual([
      'ultima-hora',
      'ultimo-dia',
      'ultima-semana',
      'ultimo-mes',
      'ultimo-ano',
      'todos',
    ])
  })

  it('incluye los límites y excluye fechas futuras en rangos relativos', () => {
    const now = new Date(2026, 9, 23, 12, 0, 0, 0)
    expect(matchesCreationDateRange(new Date(now.getTime() - 60 * 60 * 1000), 'ultima-hora', now)).toBe(true)
    expect(matchesCreationDateRange(new Date(now.getTime() - 60 * 60 * 1000 - 1), 'ultima-hora', now)).toBe(false)
    expect(matchesCreationDateRange(new Date(now.getTime() + 1), 'ultimo-dia', now)).toBe(false)
  })

  it('calcula límites de día y semana en hora local de calendario', () => {
    const now = new Date(2026, 9, 23, 12, 30, 0)
    const oneDayAgo = new Date(now)
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    expect(matchesCreationDateRange(oneDayAgo, 'ultimo-dia', now)).toBe(true)
    expect(matchesCreationDateRange(new Date(oneDayAgo.getTime() - 1), 'ultimo-dia', now)).toBe(false)
    expect(matchesCreationDateRange(oneWeekAgo, 'ultima-semana', now)).toBe(true)
    expect(matchesCreationDateRange(new Date(oneWeekAgo.getTime() - 1), 'ultima-semana', now)).toBe(false)
  })

  it('resta un mes de calendario sin desbordar el fin de mes', () => {
    const now = new Date(2026, 2, 31, 12, 0, 0)
    const threshold = new Date(2026, 1, 28, 12, 0, 0)

    expect(matchesCreationDateRange(threshold, 'ultimo-mes', now)).toBe(true)
    expect(matchesCreationDateRange(new Date(threshold.getTime() - 1), 'ultimo-mes', now)).toBe(false)
  })

  it('resta un año de calendario y conserva el límite de año bisiesto', () => {
    const now = new Date(2025, 1, 28, 12, 0, 0)
    const threshold = new Date(2024, 1, 28, 12, 0, 0)

    expect(matchesCreationDateRange(threshold, 'ultimo-ano', now)).toBe(true)
    expect(matchesCreationDateRange(new Date(threshold.getTime() - 1), 'ultimo-ano', now)).toBe(false)
  })

  it('excluye fechas inválidas aunque otros registros sigan siendo filtrables', () => {
    expect(matchesCreationDateRange(new Date(Number.NaN), 'ultimo-dia')).toBe(false)
    expect(matchesCreationDateRange(null, 'ultimo-dia')).toBe(false)
    expect(matchesCreationDateRange(null, 'todos')).toBe(true)
>>>>>>> rama-diego
  })
})
