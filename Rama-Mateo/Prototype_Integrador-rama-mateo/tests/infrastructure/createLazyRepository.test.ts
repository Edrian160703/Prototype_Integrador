import { describe, expect, it, vi } from 'vitest'
import { createLazyRepository } from '../../src/infrastructure/createLazyRepository'

describe('createLazyRepository', () => {
  it('reutiliza la misma inicialización exitosa', async () => {
    const repository = { name: 'repository' }
    const factory = vi.fn().mockResolvedValue(repository)
    const getRepository = createLazyRepository(factory)

    await expect(getRepository()).resolves.toBe(repository)
    await expect(getRepository()).resolves.toBe(repository)
    expect(factory).toHaveBeenCalledTimes(1)
  })

  it('permite volver a intentar la inicialización después de un error', async () => {
    const repository = { name: 'repository' }
    const factory = vi.fn()
      .mockRejectedValueOnce(new Error('Firestore no disponible'))
      .mockResolvedValueOnce(repository)
    const getRepository = createLazyRepository(factory)

    await expect(getRepository()).rejects.toThrow('Firestore no disponible')
    await expect(getRepository()).resolves.toBe(repository)
    expect(factory).toHaveBeenCalledTimes(2)
  })
})
