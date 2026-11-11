import { type OpeningHours } from './model'

const MINUTES_PER_DAY = 24 * 60

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

/** Whether a venue is open at a minute of the day: the start counts, the end does not. */
export function isOpenAt(hours: OpeningHours, minuteOfDay: number): boolean {
  const from = toMinutes(hours.from)
  const until = hours.until === '00:00' ? MINUTES_PER_DAY : toMinutes(hours.until)

  return minuteOfDay >= from && minuteOfDay < until
}
