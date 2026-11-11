import { type OrderLine, type OrderSummary } from './model'
import { type OrderStore } from './order-store'

export class OrderService {
  constructor(private readonly store: OrderStore) {}

  /** Summaries of the orders that have saved totals, in no particular order. */
  async listSummaries(orderIds: Array<number>): Promise<Array<OrderSummary>> {
    const summaries = orderIds.flatMap((orderId) => {
      const order = this.store.orders.get(orderId)
      const totals = this.store.totals.get(orderId)

      if (!order || !totals) return []

      return [{ orderId, customerId: order.customerId, ...totals, lines: this.linesOf(orderId) }]
    })

    return summaries.reverse()
  }

  private linesOf(orderId: number): Array<OrderLine> {
    return this.store.lines.flatMap(({ orderId: lineOrderId, ...line }) => (lineOrderId === orderId ? [line] : []))
  }
}
