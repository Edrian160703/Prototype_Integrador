export function combinarHorario(inicio: string, fin: string): string {
  if (!inicio || !fin) return ''
  return `${inicio} - ${fin} hs`
}

export function esFechaValida(dia: string, mes: string, anio: string): boolean {
  const d = Number(dia)
  const m = Number(mes)
  const y = Number(anio)
  if (!d || !m || !y || anio.length !== 4) return false
  if (m < 1 || m > 12) return false
  const diasEnMes = new Date(y, m, 0).getDate()
  return d >= 1 && d <= diasEnMes
}

export function combinarFechaHora(dia: string, mes: string, anio: string, hora: string): string {
  if (!dia || !mes || !anio || !hora || !esFechaValida(dia, mes, anio)) return ''
  return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T${hora}`
}
