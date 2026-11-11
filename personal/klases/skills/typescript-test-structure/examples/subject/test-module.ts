import { type Customer, type OrderLine } from './model'
import { OrderService } from './order.service'
import { OrderStore } from './order-store'

/** What an integration test gets: the service under test, its store, and a seeded customer. */
export interface OrderTestModule {
  service: OrderService
  store: OrderStore
  customer: Customer
}

export async function createOrderTestModule(): Promise<OrderTestModule> {
  const store = new OrderStore()

  return { service: new OrderService(store), store, customer: { id: 7, name: 'Ada' } }
}

/** Defaults to one full-price item at 10.00. */
export function createOrderLine(properties: Partial<OrderLine> = {}): OrderLine {
  return {
    sku: 'racket-grip',
    quantity: 1,
    unitPrice: 1000,
    discountPercent: 0,
    ...properties,
  }
}
