import { type EventBusClient } from './event-bus'
import { type OrderStore } from './order-store'

export interface Logger {
  warn(message: string): void
}

export class OrderConfirmation {
  constructor(
    private readonly store: OrderStore,
    private readonly bus: EventBusClient,
    private readonly logger: Logger,
  ) {}

  /** Confirms an order with saved totals and announces it; a failed announcement is logged, not raised. */
  async confirm(orderId: number): Promise<void> {
    const totals = this.store.totals.get(orderId)

    if (!totals) throw new Error(`order ${orderId} has no saved totals`)

    this.store.confirmed.add(orderId)

    try {
      await this.bus.publish({ type: 'order.confirmed', orderId, total: totals.total })
    } catch (error) {
      this.logger.warn(`order ${orderId} confirmed but not announced: ${String(error)}`)
    }
  }
}
