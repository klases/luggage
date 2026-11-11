// Scenario table: the cases differ in what exists before the call. A row states that as data built
// with curried helpers; the body turns it into setup, makes the one call, and checks the result.
import { type OrderLine, type OrderSummary } from './subject/model'
import { createOrderLine, createOrderTestModule, type OrderTestModule } from './subject/test-module'

/** What a row saves for one fixture order. */
interface SavedOrder {
  total?: number
  lines?: Array<Partial<OrderLine>>
}

/** What a row expects of one order: only the fields the case is about. */
interface ExpectedOrder extends Partial<Omit<OrderSummary, 'orderId' | 'customerId' | 'lines'>> {
  lines?: Array<Partial<OrderLine>>
}

type ExpectedSummary = ExpectedOrder & Pick<OrderSummary, 'orderId' | 'customerId'>

/** Saves one row's contents for the fixture order it is handed. */
type Prepare = (orderId: number) => Promise<void>

interface SummaryCase {
  name: string
  given: Array<Prepare>
  /** Lined up with given, one expected order each. */
  expected: Array<ExpectedOrder>
}

describe('OrderService.listSummaries', () => {
  let module: OrderTestModule
  let orderIds: Array<number>

  beforeAll(async () => {
    module = await createOrderTestModule()

    const orders = await Promise.all([1, 2].map(() => module.store.createOrder(module.customer.id)))

    // Parallel creation hands out ids in any order; rows line up with them by index.
    orderIds = orders.map(({ id }) => id).sort((a, b) => a - b)
  })

  afterEach(() => module.store.removeContents(orderIds))

  // Curried: a row names what to save now, and the body supplies the order id later.
  const saved =
    ({ total = 1000, lines = [] }: SavedOrder): Prepare =>
    async (orderId) => {
      await module.store.saveTotals(orderId, { total, currency: 'EUR' })

      for (const line of lines) await module.store.saveLine(orderId, createOrderLine(line))
    }

  // Curried: fixes the shared customer once, then adds the ids every expected order repeats.
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

    // The service promises no order; sort by the key rows line up with.
    return { ids, result: [...result].sort((a, b) => a.orderId - b.orderId) }
  }

  const summaryCases: Array<SummaryCase> = [
    {
      name: 'reads the totals of a saved order',
      given: [saved({ total: 2400 })],
      expected: [{ total: 2400, currency: 'EUR', lines: [] }],
    },
    {
      name: 'keeps lines in the order they were saved',
      given: [saved({ lines: [{ sku: 'shoes' }, { sku: 'balls' }] })],
      expected: [{ lines: [{ sku: 'shoes' }, { sku: 'balls' }] }],
    },
    {
      name: 'gives each order its own lines when reading several',
      given: [saved({ total: 1000, lines: [{ sku: 'shoes' }] }), saved({ total: 900, lines: [{ sku: 'balls' }] })],
      expected: [
        { total: 1000, lines: [{ sku: 'shoes' }] },
        { total: 900, lines: [{ sku: 'balls' }] },
      ],
    },
    {
      name: 'reads nothing for no orders',
      given: [],
      expected: [],
    },
  ]

  it.each(summaryCases)('$name', async ({ given, expected }) => {
    const { ids, result } = await listFor(given)
    const expectedWithIds = withIds(module.customer.id)

    expect(result).toMatchObject(expected.map((order, index) => expectedWithIds(order, ids[index])))
  })
})
