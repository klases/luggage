import { type OrderLine } from './model'

export interface Order {
  id: number
  customerId: number
}

export interface OrderTotals {
  total: number
  currency: string
}

interface StoredLine extends OrderLine {
  orderId: number
}

// Like a database under parallel inserts: the id is handed out after an unpredictable wait.
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, Math.random() * 5))

/** An in-memory stand-in for the tables an order is saved in. */
export class OrderStore {
  readonly orders = new Map<number, Order>()
  readonly totals = new Map<number, OrderTotals>()
  readonly lines: Array<StoredLine> = []
  private nextId = 1

  async createOrder(customerId: number): Promise<Order> {
    await pause()

    const order = { id: this.nextId++, customerId }

    this.orders.set(order.id, order)

    return order
  }

  async saveTotals(orderId: number, totals: OrderTotals): Promise<void> {
    await pause()
    this.totals.set(orderId, totals)
  }

  async saveLine(orderId: number, line: OrderLine): Promise<void> {
    await pause()
    this.lines.push({ ...line, orderId })
  }

  async removeContents(orderIds: Array<number>): Promise<void> {
    for (const orderId of orderIds) this.totals.delete(orderId)

    const kept = this.lines.flatMap((line) => (orderIds.includes(line.orderId) ? [] : [line]))

    this.lines.splice(0, this.lines.length, ...kept)
  }
}
