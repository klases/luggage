export interface OrderLine {
  sku: string
  quantity: number
  /** In cents. */
  unitPrice: number
  discountPercent: number
}

export interface OrderSummary {
  orderId: number
  customerId: number
  /** In cents. */
  total: number
  currency: string
  /** In the order they were saved. */
  lines: Array<OrderLine>
}

export interface Customer {
  id: number
  name: string
}

/** Opening hours of one day as 'HH:mm'; an `until` of '00:00' runs to midnight. */
export interface OpeningHours {
  from: string
  until: string
}
