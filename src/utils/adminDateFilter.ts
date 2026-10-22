export type CreationDateRange =
  | 'ultima-hora'
  | 'ultimo-dia'
  | 'ultima-semana'
  | 'ultimo-mes'
  | 'ultimo-ano'
  | 'todos'

export const CREATION_DATE_RANGES: readonly {
  value: CreationDateRange
  label: string
}[] = [
  { value: 'ultima-hora', label: 'Última hora' },
  { value: 'ultimo-dia', label: 'Último día' },
  { value: 'ultima-semana', label: 'Última semana' },
  { value: 'ultimo-mes', label: 'Último mes' },
  { value: 'ultimo-ano', label: 'Último año' },
  { value: 'todos', label: 'Todos' },
]

export function matchesCreationDateRange(
  createdAt: Date,
  range: CreationDateRange,
  now = new Date(),
): boolean {
  if (range === 'todos') return true

  const threshold = new Date(now)
  switch (range) {
    case 'ultima-hora':
      threshold.setHours(threshold.getHours() - 1)
      break
    case 'ultimo-dia':
      threshold.setDate(threshold.getDate() - 1)
      break
    case 'ultima-semana':
      threshold.setDate(threshold.getDate() - 7)
      break
    case 'ultimo-mes':
      threshold.setDate(1)
      threshold.setMonth(threshold.getMonth() - 1)
      threshold.setDate(
        Math.min(now.getDate(), new Date(
          threshold.getFullYear(),
          threshold.getMonth() + 1,
          0,
        ).getDate()),
      )
      break
    case 'ultimo-ano':
      threshold.setDate(1)
      threshold.setFullYear(threshold.getFullYear() - 1)
      threshold.setDate(
        Math.min(now.getDate(), new Date(
          threshold.getFullYear(),
          threshold.getMonth() + 1,
          0,
        ).getDate()),
      )
      break
  }

  return createdAt >= threshold && createdAt <= now
}
