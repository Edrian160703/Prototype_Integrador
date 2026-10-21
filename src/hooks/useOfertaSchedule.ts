import { useState } from 'react'
import { combinarFechaHora, combinarHorario } from '../utils/ofertaForm'

type FechaPart = 'dia' | 'mes' | 'anio' | 'hora'

interface OfertaScheduleOptions {
  onHorarioChange: (value: string) => void
  onFechaChange: (value: string) => void
}

export default function useOfertaSchedule({
  onHorarioChange,
  onFechaChange,
}: OfertaScheduleOptions) {
  const [horarioInicio, setHorarioInicio] = useState('')
  const [horarioFin, setHorarioFin] = useState('')
  const [fechaDia, setFechaDia] = useState('')
  const [fechaMes, setFechaMes] = useState('')
  const [fechaAnio, setFechaAnio] = useState('')
  const [fechaHora, setFechaHora] = useState('')

  const handleHorarioInicioChange = (value: string) => {
    setHorarioInicio(value)
    onHorarioChange(combinarHorario(value, horarioFin))
  }

  const handleHorarioFinChange = (value: string) => {
    setHorarioFin(value)
    onHorarioChange(combinarHorario(horarioInicio, value))
  }

  const handleFechaChange = (part: FechaPart, value: string) => {
    const next = {
      dia: part === 'dia' ? value : fechaDia,
      mes: part === 'mes' ? value : fechaMes,
      anio: part === 'anio' ? value : fechaAnio,
      hora: part === 'hora' ? value : fechaHora,
    }

    if (part === 'dia') setFechaDia(value)
    if (part === 'mes') setFechaMes(value)
    if (part === 'anio') setFechaAnio(value)
    if (part === 'hora') setFechaHora(value)
    onFechaChange(combinarFechaHora(next.dia, next.mes, next.anio, next.hora))
  }

  const resetSchedule = () => {
    setHorarioInicio('')
    setHorarioFin('')
    setFechaDia('')
    setFechaMes('')
    setFechaAnio('')
    setFechaHora('')
  }

  return {
    horarioInicio,
    horarioFin,
    fechaDia,
    fechaMes,
    fechaAnio,
    fechaHora,
    handleHorarioInicioChange,
    handleHorarioFinChange,
    handleFechaChange,
    resetSchedule,
  }
}
