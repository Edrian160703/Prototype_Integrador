export interface ComercioSummary {
  businessName?: string
  district?: string
}

export interface ComercioReader {
  getCommerceById(id: string): Promise<ComercioSummary | null>
}
