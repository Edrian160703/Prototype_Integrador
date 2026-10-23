import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useOfertaImage from '../../src/hooks/useOfertaImage'

describe('useOfertaImage', () => {
  afterEach(() => {
    cleanup()
  })

  it('gestiona la vista previa de una URL y limpia la imagen al cambiar de modo', () => {
    const onImageChange = vi.fn()
    const { result } = renderHook(() => useOfertaImage(onImageChange))

    act(() => result.current.handleUrlChange('  https://example.com/producto.jpg  '))

    expect(result.current.imagePreview).toBe('https://example.com/producto.jpg')
    expect(onImageChange).toHaveBeenLastCalledWith('  https://example.com/producto.jpg  ')

    act(() => result.current.switchImageMode('upload'))

    expect(result.current.imageMode).toBe('upload')
    expect(result.current.imagePreview).toBe('')
    expect(onImageChange).toHaveBeenLastCalledWith('')
  })

  it('quita la imagen sin cambiar el modo seleccionado', () => {
    const onImageChange = vi.fn()
    const { result } = renderHook(() => useOfertaImage(onImageChange))

    act(() => result.current.handleUrlChange('https://example.com/producto.jpg'))
    act(() => result.current.removeImage())

    expect(result.current.imageMode).toBe('upload')
    expect(result.current.imagePreview).toBe('')
    expect(onImageChange).toHaveBeenLastCalledWith('')
  })
})
