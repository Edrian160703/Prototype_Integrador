export interface IdGenerator {
  next(): string
}

export interface NamedIdGenerator {
  next(name: string): string
}
