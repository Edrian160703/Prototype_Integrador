export function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year, month - 1, day)

  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day
}

export function sameCalendarDate(left: string, right: string): boolean {
  if (!isValidDateOnly(left) || !isValidDateOnly(right)) return false
  return toUtcDate(left).getTime() === toUtcDate(right).getTime()
}

function toUtcDate(value: string): Date {
  const [yearText, monthText, dayText] = value.split('-')
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(Number(yearText), Number(monthText) - 1, Number(dayText))
  return date
}
