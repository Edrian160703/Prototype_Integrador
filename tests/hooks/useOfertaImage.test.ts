import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ChangeEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useOfertaImage from '../../src/hooks/useOfertaImage'
import type { FoodScanResult } from '../../src/infrastructure/ai/foodImageScanner'

const FOOD: FoodScanResult = { isFood: true, confidence: 0.95, label: 'pizza', reason: '' }
const NOT_FOOD: FoodScanResult = { isFood: false, confidence: 0.97, label: 'zapatillas', reason: '' }

function fileEvent(file: File) {
  return { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>
}

describe('useOfertaImage', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('acepta una imagen de comida y la envía al formulario', async () => {
    const onImageChange = vi.fn()
    const scanner = vi.fn().mockResolvedValue(FOOD)
    const { result } = renderHook(() => useOfertaImage(onImageChange, scanner))

    await act(() => result.current.handleFileChange(fileEvent(new File(['x'], 'pizza.png', { type: 'image/png' }))))

    expect(scanner).toHaveBeenCalledOnce()
    expect(result.current.imageError).toBe('')
    expect(result.current.imagePreview).toMatch(/^data:image\/png/)
    expect(onImageChange).toHaveBeenLastCalledWith(result.current.imagePreview)
  })

  it('rechaza una imagen que no es comida', async () => {
    const onImageChange = vi.fn()
    const scanner = vi.fn().mockResolvedValue(NOT_FOOD)
    const { result } = renderHook(() => useOfertaImage(onImageChange, scanner))

    await act(() => result.current.handleFileChange(fileEvent(new File(['x'], 'shoe.jpg', { type: 'image/jpeg' }))))

    expect(result.current.imageError).toContain('Solo se aceptan imágenes de productos alimenticios')
    expect(result.current.imagePreview).toBe('')
    expect(onImageChange).toHaveBeenLastCalledWith('')
  })

  it('rechaza la imagen si la IA falla (no deja pasar nada sin verificar)', async () => {
    const onImageChange = vi.fn()
    const scanner = vi.fn().mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useOfertaImage(onImageChange, scanner))

    await act(() => result.current.handleFileChange(fileEvent(new File(['x'], 'a.webp', { type: 'image/webp' }))))

    expect(result.current.imageError).toContain('No pudimos verificar')
    expect(onImageChange).toHaveBeenLastCalledWith('')
  })

  it('no llama a la IA con formatos no permitidos', async () => {
    const scanner = vi.fn()
    const { result } = renderHook(() => useOfertaImage(vi.fn(), scanner))

    await act(() => result.current.handleFileChange(fileEvent(new File(['x'], 'a.gif', { type: 'image/gif' }))))

    expect(scanner).not.toHaveBeenCalled()
    expect(result.current.imageError).toContain('JPG, PNG o WEBP')
  })

  it('en modo URL no acepta el valor hasta que la IA lo aprueba', async () => {
    const onImageChange = vi.fn()
    const scanner = vi.fn().mockResolvedValue(FOOD)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(['x'], { type: 'image/jpeg' }) }),
    )
    const { result } = renderHook(() => useOfertaImage(onImageChange, scanner))

    act(() => result.current.handleUrlChange('https://example.com/producto.jpg'))
    expect(result.current.urlInput).toBe('https://example.com/producto.jpg')
    expect(result.current.imagePreview).toBe('')
    expect(onImageChange).toHaveBeenLastCalledWith('')

    await waitFor(() => expect(result.current.imagePreview).toBe('https://example.com/producto.jpg'))
    expect(onImageChange).toHaveBeenLastCalledWith('https://example.com/producto.jpg')
    vi.unstubAllGlobals()
  })

  it('limpia la imagen al cambiar de modo y al quitarla', () => {
    const onImageChange = vi.fn()
    const { result } = renderHook(() => useOfertaImage(onImageChange, vi.fn()))

    act(() => result.current.switchImageMode('url'))
    expect(result.current.imageMode).toBe('url')
    expect(onImageChange).toHaveBeenLastCalledWith('')

    act(() => result.current.removeImage())
    expect(result.current.imagePreview).toBe('')
    expect(result.current.urlInput).toBe('')
  })
})
