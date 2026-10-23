import { describe, expect, it } from 'vitest'
import {
  CREATION_DATE_RANGES,
  matchesCreationDateRange,
} from '../../src/utils/adminDateFilter'

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
  })
})
