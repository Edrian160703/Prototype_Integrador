import { describe, expect, it } from 'vitest'
import {
  CREATION_DATE_RANGES,
  matchesCreationDateRange,
} from '../../src/utils/adminDateFilter'

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
  })
})
