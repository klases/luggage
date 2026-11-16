export interface PublishedEvent {
  type: string
  orderId: number
  total: number
}

/** Announces events to an external event bus over HTTP. */
export class EventBusClient {
  constructor(private readonly baseUrl: string) {}

  async publish(event: PublishedEvent): Promise<void> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
    })

    if (!response.ok) throw new Error(`event bus answered ${response.status}`)
  }
}
