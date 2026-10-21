export function createLazyRepository<T>(factory: () => Promise<T>): () => Promise<T> {
  let repository: Promise<T> | undefined

  return () => {
    if (!repository) {
      repository = factory().catch((error: unknown) => {
        repository = undefined
        throw error
      })
    }

    return repository
  }
}
