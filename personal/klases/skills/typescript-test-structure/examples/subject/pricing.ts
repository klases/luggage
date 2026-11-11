import { type OrderLine } from './model'

/** The line's price in cents after its discount, rounded half up. */
export function lineTotal(line: OrderLine): number {
  return Math.round(line.quantity * line.unitPrice * (1 - line.discountPercent / 100))
}
