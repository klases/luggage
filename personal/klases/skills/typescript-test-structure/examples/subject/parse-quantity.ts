const MIN_QUANTITY = 1
const MAX_QUANTITY = 99

/** Reads a quantity a customer typed: a whole number from 1 to 99, surrounding spaces allowed. */
export function parseQuantity(input: string): number {
  const trimmed = input.trim()

  if (!/^\d+$/.test(trimmed)) throw new Error(`not a whole number: "${input}"`)

  const quantity = Number(trimmed)

  if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new Error(`out of range ${MIN_QUANTITY}-${MAX_QUANTITY}: ${quantity}`)
  }

  return quantity
}
