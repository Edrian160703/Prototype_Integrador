import { act, cleanup, renderHook } from '@testing-library/react'
import type { FormEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { OfertaFormValidationContext, OfertaFormValues } from '../../src/utils/ofertaFormTypes'

const mocks = vi.hoisted(() => ({
  publishOferta: vi.fn(),
  showError: vi.fn(),
  clearStatus: vi.fn(),
}))

vi.mock('../../src/hooks/usePublicarOferta', () => ({
  default: () => ({
    status: 'idle',
    statusMessage: '',
    saving: false,
    clearStatus: mocks.clearStatus,
    showError: mocks.showError,
    publishOferta: mocks.publishOferta,
  }),
}))

import useOfertaSubmission from '../../src/hooks/useOfertaSubmission'

const values: OfertaFormValues = {
  nombre_producto: 'Pan del día',
  id_categoria: 'panaderia',
  descripcion: 'Pan recién horneado',
  precio_original: '12',
  precio_oferta: '8',
  cantidad_disponible: '4',
  horario_recojo: '17:00 - 19:00 hs',
  fecha_limite: '2030-04-08T18:00',
  fecha_vencimiento: '2030-04-10',
  imagen_url: 'data:image/png;base64,abc',
}

const context: OfertaFormValidationContext = {
  horarioInicio: '17:00',
  horarioFin: '19:00',
  fechaDia: '8',
  fechaMes: '4',
  fechaAnio: '2030',
  fechaHora: '18:00',
  imageMode: 'upload',
  ahoraLocal: '2029-01-01T00:00',
}

describe('useOfertaSubmission image gate', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('does not start publication or storage upload when evidence validation is missing', async () => {
    const { result } = renderHook(() => useOfertaSubmission({
      getValues: () => values,
      getValidationContext: () => context,
      getPublicationImages: () => null,
      onPublished: vi.fn(),
    }))

    await act(() => result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>))

    expect(mocks.publishOferta).not.toHaveBeenCalled()
    expect(mocks.showError).toHaveBeenCalledWith(
      'Selecciona y valida las imágenes del alimento y de su vencimiento.',
    )
  })

  it('does not start publication if the validated image date differs from the submitted form date', async () => {
    const { result } = renderHook(() => useOfertaSubmission({
      getValues: () => values,
      getValidationContext: () => context,
      getPublicationImages: () => ({
        food: new Blob(['food']),
        expirationEvidence: new Blob(['label']),
        expirationDate: '2030-04-09',
      }),
      onPublished: vi.fn(),
    }))

    await act(() => result.current.handleSubmit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>))

    expect(mocks.publishOferta).not.toHaveBeenCalled()
    expect(mocks.showError).toHaveBeenCalled()
  })
})
