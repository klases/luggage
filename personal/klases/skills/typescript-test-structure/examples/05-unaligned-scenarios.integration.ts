// When scenarios do not line up with the table:
// - a fixture without a result: null in `expected` keeps the rows lined up with `given`;
// - a case that pins the full result: standalone, because partial matching lets extra fields through;
// - a case about save order across orders: standalone, because a row saves one order at a time.
import { type OrderLine, type OrderSummary } from './subject/model'
import { createOrderLine, createOrderTestModule, type OrderTestModule } from './subject/test-module'

interface SavedOrder {
  total?: number
  lines?: Array<Partial<OrderLine>>
}

interface ExpectedOrder extends Partial<Omit<OrderSummary, 'orderId' | 'customerId' | 'lines'>> {
  lines?: Array<Partial<OrderLine>>
}

type ExpectedSummary = ExpectedOrder & Pick<OrderSummary, 'orderId' | 'customerId'>

type Prepare = (orderId: number) => Promise<void>

interface SummaryCase {
  name: string
  given: Array<Prepare>
  /** Lined up with given; null where that order is absent from the result. */
  expected: Array<ExpectedOrder | null>
}

const byOrderId = (a: OrderSummary, b: OrderSummary) => a.orderId - b.orderId

describe('OrderService.listSummaries', () => {
  let module: OrderTestModule
  let orderIds: Array<number>

  beforeAll(async () => {
    module = await createOrderTestModule()

    const orders = await Promise.all([1, 2].map(() => module.store.createOrder(module.customer.id)))

    orderIds = orders.map(({ id }) => id).sort((a, b) => a - b)
  })

  afterEach(() => module.store.removeContents(orderIds))

  const saved =
    ({ total = 1000, lines = [] }: SavedOrder): Prepare =>
    async (orderId) => {
      await module.store.saveTotals(orderId, { total, currency: 'EUR' })

      for (const line of lines) await module.store.saveLine(orderId, createOrderLine(line))
    }

  const nothing: Prepare = async () => {}

  const withIds =
    (customerId: number) =>
    (order: ExpectedOrder, orderId: number): ExpectedSummary => ({ ...order, orderId, customerId })

  const listFor = async (given: Array<Prepare>) => {
    if (given.length > orderIds.length) {
      throw new Error(`row needs ${given.length} orders, the fixture has ${orderIds.length}`)
    }

    const ids = orderIds.slice(0, given.length)

    for (const [index, prepare] of given.entries()) await prepare(ids[index])

    const result = await module.service.listSummaries(ids)

    return { ids, result: [...result].sort(byOrderId) }
  }

  describe('with absent orders', () => {
    const summaryCases: Array<SummaryCase> = [
      {
        name: 'leaves out an order without saved totals',
        given: [saved({ total: 2400 }), nothing],
        expected: [{ total: 2400 }, null],
      },
      {
        name: 'leaves out the first order when only the second was saved',
        given: [nothing, saved({ total: 900 })],
        expected: [null, { total: 900 }],
      },
      {
        name: 'reads nothing when no order was saved',
        given: [nothing, nothing],
        expected: [null, null],
      },
    ]

    it.each(summaryCases)('$name', async ({ given, expected }) => {
      const { ids, result } = await listFor(given)
      const expectedWithIds = withIds(module.customer.id)

      expect(result).toMatchObject(
        expected.flatMap((order, index) => (order ? [expectedWithIds(order, ids[index])] : [])),
      )
    })
  })

  // Outside the table: pins the full result with an exact toEqual, so an extra field fails too.
  it('composes the full summary of an order', async () => {
    const [orderId] = orderIds

    await saved({ total: 1500, lines: [{ sku: 'shoes', quantity: 2, unitPrice: 750 }] })(orderId)

    const expected: Array<OrderSummary> = [
      {
        orderId,
        customerId: module.customer.id,
        total: 1500,
        currency: 'EUR',
        lines: [{ sku: 'shoes', quantity: 2, unitPrice: 750, discountPercent: 0 }],
      },
    ]

    const result = await module.service.listSummaries([orderId])

    expect(result).toEqual(expected)
  })

  // Outside the table: saves the second order's lines before the first's, which a row cannot state.
  it('attributes lines to their own order whatever order they were saved in', async () => {
    const [firstId, secondId] = orderIds

    await module.store.saveTotals(secondId, { total: 900, currency: 'EUR' })
    await module.store.saveLine(secondId, createOrderLine({ sku: 'balls' }))
    await module.store.saveTotals(firstId, { total: 1000, currency: 'EUR' })
    await module.store.saveLine(firstId, createOrderLine({ sku: 'shoes' }))

    const expectedWithIds = withIds(module.customer.id)

    const expected = [
      expectedWithIds({ lines: [{ sku: 'shoes' }] }, firstId),
      expectedWithIds({ lines: [{ sku: 'balls' }] }, secondId),
    ]

    const result = [...(await module.service.listSummaries([firstId, secondId]))].sort(byOrderId)

    expect(result).toMatchObject(expected)
  })
})
