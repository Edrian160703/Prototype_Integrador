import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useOfertaSchedule from '../../src/hooks/useOfertaSchedule'

describe('useOfertaSchedule', () => {
  afterEach(() => {
    cleanup()
  })

  it('combina los horarios y la fecha límite a partir de sus campos', () => {
    const onHorarioChange = vi.fn()
    const onFechaChange = vi.fn()
    const { result } = renderHook(() => useOfertaSchedule({ onHorarioChange, onFechaChange }))

    act(() => result.current.handleHorarioInicioChange('17:00'))
    act(() => result.current.handleHorarioFinChange('19:30'))
    act(() => result.current.handleFechaChange('dia', '8'))
    act(() => result.current.handleFechaChange('mes', '4'))
    act(() => result.current.handleFechaChange('anio', '2027'))
    act(() => result.current.handleFechaChange('hora', '18:00'))

    expect(onHorarioChange).toHaveBeenLastCalledWith('17:00 - 19:30 hs')
    expect(onFechaChange).toHaveBeenLastCalledWith('2027-04-08T18:00')
    expect(result.current.horarioInicio).toBe('17:00')
    expect(result.current.horarioFin).toBe('19:30')
    expect(result.current.fechaDia).toBe('8')
  })

  it('restablece todos los campos de disponibilidad', () => {
    const onHorarioChange = vi.fn()
    const onFechaChange = vi.fn()
    const { result } = renderHook(() => useOfertaSchedule({ onHorarioChange, onFechaChange }))

    act(() => result.current.handleHorarioInicioChange('17:00'))
    act(() => result.current.handleHorarioFinChange('19:30'))
    act(() => result.current.handleFechaChange('dia', '8'))
    act(() => result.current.resetSchedule())

    expect(result.current.horarioInicio).toBe('')
    expect(result.current.horarioFin).toBe('')
    expect(result.current.fechaDia).toBe('')
    expect(result.current.fechaMes).toBe('')
    expect(result.current.fechaAnio).toBe('')
    expect(result.current.fechaHora).toBe('')
  })
})
