// Assert outcomes, not calls: what the store holds afterwards, and what a fake external service
// received on the wire. An assertion that one of our own functions was or wasn't called goes
// silently stale when the call path changes; an outcome check does not.
// - Stubbing an input is fine (a repository returning fixed rows); asserting that it was called is not.
// - When the interaction is the contract itself (a loader batching ids into one query), assert it.
// - A spy on our own code is a last resort, for a trace nothing else can observe, with its reason
//   in a comment (the last test below).
import { createServer, type Server } from 'node:http'
import { type AddressInfo } from 'node:net'

import { EventBusClient, type PublishedEvent } from './subject/event-bus'
import { type OrderTotals } from './subject/order-store'
import { OrderConfirmation } from './subject/order-confirmation'
import { createOrderTestModule, type OrderTestModule } from './subject/test-module'

/** One request the fake event bus received. */
interface ReceivedRequest {
  method: string
  path: string
  event: PublishedEvent
}

/** A wire-level stand-in for the event bus: it records every request and answers with a set status. */
interface FakeEventBus {
  url: string
  received: Array<ReceivedRequest>
  answerWith: (status: number) => void
  close: () => Promise<void>
}

/** Everything a confirmation leaves behind that someone outside could observe. */
interface ConfirmOutcome {
  error: string | null
  confirmed: boolean
  received: Array<ReceivedRequest>
}

interface ConfirmCase {
  name: string
  saved: OrderTotals
  busStatus: number
  expected: Omit<ConfirmOutcome, 'received'> & { announced: Array<Omit<PublishedEvent, 'orderId'>> }
}

const startFakeEventBus = async (): Promise<FakeEventBus> => {
  const received: Array<ReceivedRequest> = []
  let status = 202

  const server: Server = createServer((request, response) => {
    let body = ''

    request.on('data', (chunk: Buffer) => {
      body += chunk.toString()
    })
    request.on('end', () => {
      received.push({ method: request.method ?? '', path: request.url ?? '', event: JSON.parse(body) })
      response.writeHead(status).end()
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  // SAFETY: a server listening on a TCP port reports its address as an AddressInfo, never a pipe name.
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    received,
    answerWith: (next) => {
      status = next
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

describe('OrderConfirmation.confirm', () => {
  let module: OrderTestModule
  let bus: FakeEventBus
  let orderId: number

  const warn = jest.fn()

  beforeAll(async () => {
    module = await createOrderTestModule()
    bus = await startFakeEventBus()

    const order = await module.store.createOrder(module.customer.id)

    orderId = order.id
  })

  afterEach(async () => {
    await module.store.removeContents([orderId])
    bus.received.splice(0)
    bus.answerWith(202)
    warn.mockClear()
  })

  afterAll(() => bus.close())

  // The act helper: one call to the subject, then everything an outsider could observe.
  const confirmOutcome = async (): Promise<ConfirmOutcome> => {
    const confirmation = new OrderConfirmation(module.store, new EventBusClient(bus.url), { warn })

    const error = await confirmation.confirm(orderId).then(
      () => null,
      (reason: Error) => reason.message,
    )

    return { error, confirmed: module.store.confirmed.has(orderId), received: bus.received }
  }

  // Curried: rows name the announced events without the run-time order id; the body adds it.
  const expectedOutcome =
    (id: number) =>
    ({ announced, ...rest }: ConfirmCase['expected']): ConfirmOutcome => ({
      ...rest,
      received: announced.map((event) => ({ method: 'POST', path: '/events', event: { ...event, orderId: id } })),
    })

  describe('with saved totals', () => {
    const confirmCases: Array<ConfirmCase> = [
      {
        name: 'confirms the order and announces its total',
        saved: { total: 2400, currency: 'EUR' },
        busStatus: 202,
        expected: { error: null, confirmed: true, announced: [{ type: 'order.confirmed', total: 2400 }] },
      },
      {
        name: 'announces a free order with a zero total',
        saved: { total: 0, currency: 'EUR' },
        busStatus: 202,
        expected: { error: null, confirmed: true, announced: [{ type: 'order.confirmed', total: 0 }] },
      },
      {
        name: 'keeps the order confirmed when the event bus turns the announcement down',
        saved: { total: 900, currency: 'EUR' },
        busStatus: 503,
        expected: { error: null, confirmed: true, announced: [{ type: 'order.confirmed', total: 900 }] },
      },
    ]

    it.each(confirmCases)('$name', async ({ saved, busStatus, expected }) => {
      await module.store.saveTotals(orderId, saved)
      bus.answerWith(busStatus)

      const result = await confirmOutcome()

      expect(result).toEqual(expectedOutcome(orderId)(expected))
    })
  })

  // Outside the table: a failure, so it checks the error together with what was left untouched.
  it('refuses an order without saved totals, leaves it unconfirmed and announces nothing', async () => {
    const expected: ConfirmOutcome = {
      error: `order ${orderId} has no saved totals`,
      confirmed: false,
      received: [],
    }

    const result = await confirmOutcome()

    expect(result).toEqual(expected)
  })

  // A spy, as a last resort: the log line is the only trace a turned-down announcement leaves.
  it('warns when the announcement is turned down', async () => {
    await module.store.saveTotals(orderId, { total: 900, currency: 'EUR' })
    bus.answerWith(503)

    await confirmOutcome()

    expect(warn).toHaveBeenCalledWith(`order ${orderId} confirmed but not announced: Error: event bus answered 503`)
  })
})
