export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U'
  )
}

export function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'hace instantes'
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days} d`
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })
}
