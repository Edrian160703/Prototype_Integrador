import { isValidDecimal } from './ofertaNumber'

export interface OfertaDiscount {
  valid: boolean
  percentage: number
}

export function calculateOfertaDiscount(
  originalPrice: string,
  offerPrice: string,
): OfertaDiscount {
  const valid = isValidDecimal(originalPrice)
    && isValidDecimal(offerPrice)
    && Number(offerPrice) < Number(originalPrice)

  return {
    valid,
    percentage: valid
      ? Math.round((1 - Number(offerPrice) / Number(originalPrice)) * 100)
      : 0,
  }
}
