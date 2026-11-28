import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useExpirationEvidenceImage from '../../src/hooks/useExpirationEvidenceImage'
import type { ExpirationDateScanResult } from '../../src/infrastructure/ai/foodImageScanner'

const MATCHING_DATE: ExpirationDateScanResult = {
  isLegible: true,
  isUnambiguous: true,
  dateISO: '2027-05-09',
  confidence: 0.95,
}

function fileEvent(file: File) {
  return { target: { files: [file], value: 'selected' } } as unknown as ChangeEvent<HTMLInputElement>
}

describe('useExpirationEvidenceImage', () => {
  afterEach(cleanup)

  it('valida la evidencia contra la fecha calendario ingresada', async () => {
    const scanner = vi.fn().mockResolvedValue(MATCHING_DATE)
    const { result } = renderHook(() => useExpirationEvidenceImage('2027-05-09', scanner))

    await act(() => result.current.handleFileChange(fileEvent(
      new File(['evidence'], 'label.png', { type: 'image/png' }),
    )))

    await waitFor(() => expect(result.current.isValidated).toBe(true))
    expect(result.current.recognizedDate).toBe('2027-05-09')
  })

  it('muestra el mensaje exacto de discrepancia y reanaliza al cambiar la fecha', async () => {
    const scanner = vi.fn()
      .mockResolvedValueOnce(MATCHING_DATE)
      .mockResolvedValueOnce(MATCHING_DATE)
    const { result, rerender } = renderHook(
      ({ date }) => useExpirationEvidenceImage(date, scanner),
      { initialProps: { date: '2027-05-09' } },
    )
    await act(() => result.current.handleFileChange(fileEvent(
      new File(['evidence'], 'label.png', { type: 'image/png' }),
    )))
    await waitFor(() => expect(result.current.isValidated).toBe(true))

    rerender({ date: '2027-05-10' })
    expect(result.current.isValidated).toBe(false)
    await waitFor(() => expect(result.current.message).toBe('La fecha de vencimiento no es la misma'))
    expect(scanner).toHaveBeenCalledTimes(2)
  })

  it('invalida el resultado anterior al reemplazar la fotografía', async () => {
    let resolveSecondScan: ((value: ExpirationDateScanResult) => void) | undefined
    const scanner = vi.fn()
      .mockResolvedValueOnce(MATCHING_DATE)
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecondScan = resolve
      }))
    const { result } = renderHook(() => useExpirationEvidenceImage('2027-05-09', scanner))
    await act(() => result.current.handleFileChange(fileEvent(
      new File(['first'], 'first.png', { type: 'image/png' }),
    )))
    await waitFor(() => expect(result.current.isValidated).toBe(true))

    await act(() => result.current.handleFileChange(fileEvent(
      new File(['second'], 'second.png', { type: 'image/png' }),
    )))
    expect(result.current.isValidated).toBe(false)
    await waitFor(() => expect(scanner).toHaveBeenCalledTimes(2))
    await act(() => resolveSecondScan?.(MATCHING_DATE))
    await waitFor(() => expect(result.current.isValidated).toBe(true))
  })

  it('bloquea resultados ilegibles y no muestra respuestas técnicas', async () => {
    const scanner = vi.fn().mockResolvedValue({
      isLegible: false,
      isUnambiguous: false,
      dateISO: null,
      confidence: 0.2,
    })
    const { result } = renderHook(() => useExpirationEvidenceImage('2027-05-09', scanner))
    await act(() => result.current.handleFileChange(fileEvent(
      new File(['evidence'], 'label.png', { type: 'image/png' }),
    )))

    await waitFor(() => expect(result.current.state).toBe('invalid'))
    expect(result.current.isValidated).toBe(false)
    expect(result.current.message).not.toContain('JSON')
  })
})
