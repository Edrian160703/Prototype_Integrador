import type { IdGenerator, NamedIdGenerator } from '../ports/idGenerator'
import { toSlug } from '../utils/slug'

const READABLE_ID_NAME_MAX_LENGTH = 60
const READABLE_ID_SUFFIX_LENGTH = 8
const READABLE_ID_FALLBACK_NAME = 'sin_nombre'

export function createReadableIdGenerator(base: IdGenerator, prefix = ''): NamedIdGenerator {
  return {
    next(name: string) {
      const slug = toSlug(name).slice(0, READABLE_ID_NAME_MAX_LENGTH).replace(/_+$/, '')
      const suffix = base.next().replace(/-/g, '').slice(0, READABLE_ID_SUFFIX_LENGTH)
      return [prefix, slug || READABLE_ID_FALLBACK_NAME, suffix].filter(Boolean).join('_')
    },
  }
}
