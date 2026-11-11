// Value table: the cases differ in input data only, so one body runs every row.
import { type OrderLine } from './subject/model'
import { lineTotal } from './subject/pricing'
import { createOrderLine } from './subject/test-module'

interface LineTotalCase {
  name: string
  line: OrderLine
  expected: number
}

describe('lineTotal', () => {
  const lineTotalCases: Array<LineTotalCase> = [
    {
      name: 'charges the quantity times the unit price',
      line: createOrderLine({ quantity: 3, unitPrice: 1000 }),
      expected: 3000,
    },
    {
      name: 'takes the discount off',
      line: createOrderLine({ quantity: 2, unitPrice: 1000, discountPercent: 25 }),
      expected: 1500,
    },
    {
      name: 'rounds half a cent up',
      line: createOrderLine({ quantity: 1, unitPrice: 105, discountPercent: 50 }),
      expected: 53,
    },
    {
      name: 'charges nothing at a full discount',
      line: createOrderLine({ quantity: 4, discountPercent: 100 }),
      expected: 0,
    },
  ]

  it.each(lineTotalCases)('$name', ({ line, expected }) => {
    const result = lineTotal(line)

    expect(result).toBe(expected)
  })
})
