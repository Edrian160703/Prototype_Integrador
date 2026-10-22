export function filterAdminItems<T>(
  items: readonly T[],
  query: string,
  getSearchableValues: (item: T) => readonly string[],
  matchesFilters: (item: T) => boolean,
): T[] {
  const normalizedQuery = query.toLowerCase()

  return items.filter(
    (item) =>
      getSearchableValues(item).some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      ) &&
      matchesFilters(item),
  )
}

export function paginateAdminItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): { pageItems: T[]; currentPage: number; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(Math.max(page, 1), totalPages)
  const startIndex = (currentPage - 1) * pageSize

  return {
    pageItems: items.slice(startIndex, startIndex + pageSize),
    currentPage,
    totalPages,
  }
}

export function countAdminStatuses<T, Status extends string>(
  items: readonly T[],
  statuses: readonly Status[],
  getStatus: (item: T) => Status,
): Map<Status, number> {
  const counts = new Map<Status, number>(
    statuses.map((status): [Status, number] => [status, 0]),
  )

  for (const item of items) {
    const status = getStatus(item)
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  return counts
}
