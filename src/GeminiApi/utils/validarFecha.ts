const BUSINESS_TIME_ZONE = 'America/Lima'
const BUSINESS_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

interface CalendarDate {
  year: number
  month: number
  day: number
}

function parseCalendarDate(value: unknown): CalendarDate | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  if (year < 1 || month < 1 || month > 12) return null

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const daysInMonth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][month - 1]

  if (day < 1 || day > daysInMonth) return null
  return { year, month, day }
}

function compareCalendarDates(left: CalendarDate, right: CalendarDate): -1 | 0 | 1 {
  if (left.year !== right.year) return left.year < right.year ? -1 : 1
  if (left.month !== right.month) return left.month < right.month ? -1 : 1
  if (left.day !== right.day) return left.day < right.day ? -1 : 1
  return 0
}

export function isValidIsoDate(value: unknown): value is string {
  return parseCalendarDate(value) !== null
}

export function compareIsoCalendarDates(left: string, right: string): -1 | 0 | 1 | null {
  const leftDate = parseCalendarDate(left)
  const rightDate = parseCalendarDate(right)
  if (!leftDate || !rightDate) return null
  return compareCalendarDates(leftDate, rightDate)
}

export function getBusinessCalendarDate(now = new Date()): string {
  const parts = BUSINESS_DATE_FORMATTER.formatToParts(now)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  if (!year || !month || !day) throw new Error('No se pudo determinar la fecha de negocio.')
  return `${year.padStart(4, '0')}-${month}-${day}`
}

export function isExpiredIsoDateOnBusinessDate(value: string, businessDate: string): boolean {
  const comparison = compareIsoCalendarDates(value, businessDate)
  return comparison !== null && comparison < 0
}

export function isExpiredIsoDate(value: string, now = new Date()): boolean {
  return isExpiredIsoDateOnBusinessDate(value, getBusinessCalendarDate(now))
}

export function isEvaluationDateCurrent(value: unknown, now = new Date()): boolean {
  if (!isValidIsoDate(value)) return false
  return value === getBusinessCalendarDate(now)
}