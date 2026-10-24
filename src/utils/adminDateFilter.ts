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

function subtractCalendarMonths(date: Date, months: number): Date {
  const threshold = new Date(date)
  const originalDay = threshold.getDate()
  threshold.setDate(1)
  threshold.setMonth(threshold.getMonth() - months)
  const lastDayOfMonth = new Date(
    threshold.getFullYear(),
    threshold.getMonth() + 1,
    0,
  ).getDate()
  threshold.setDate(Math.min(originalDay, lastDayOfMonth))
  return threshold
}

export function matchesCreationDateRange(
  createdAt: Date | null,
  range: CreationDateRange,
  now = new Date(),
): boolean {
  if (range === 'todos') return true
  if (
    !(createdAt instanceof Date) ||
    Number.isNaN(createdAt.getTime()) ||
    Number.isNaN(now.getTime())
  ) {
    return false
  }

  let threshold: Date
  switch (range) {
    case 'ultima-hora':
      threshold = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case 'ultimo-dia':
      threshold = new Date(now)
      threshold.setDate(threshold.getDate() - 1)
      break
    case 'ultima-semana':
      threshold = new Date(now)
      threshold.setDate(threshold.getDate() - 7)
      break
    case 'ultimo-mes':
      threshold = subtractCalendarMonths(now, 1)
      break
    case 'ultimo-ano':
      threshold = subtractCalendarMonths(now, 12)
      break
  }

  const timestamp = createdAt.getTime()
  return timestamp >= threshold.getTime() && timestamp <= now.getTime()
}
