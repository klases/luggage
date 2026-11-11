// Before: one test making several expects on the same call with different inputs. That is a table
// in disguise: the first failing expect hides the rest, and the test name has to cover them all.
//
//   it('includes the start and excludes the end of the opening hours', () => {
//     expect(isOpenAt(dayShift, 8 * 60)).toBe(true)
//     expect(isOpenAt(dayShift, 17 * 60 + 59)).toBe(true)
//     expect(isOpenAt(dayShift, 18 * 60)).toBe(false)
//     expect(isOpenAt(lateShift, 23 * 60 + 59)).toBe(true)
//   })
//
// After: each expect is a row with its own name, and every row runs and reports on its own.
import { type OpeningHours } from './subject/model'
import { isOpenAt } from './subject/opening-hours'

type MinuteOfDay = number

interface OpenAtCase {
  name: string
  hours: OpeningHours
  at: MinuteOfDay
  expected: boolean
}

const at = (hour: number, minute = 0): MinuteOfDay => hour * 60 + minute
const dayShift: OpeningHours = { from: '08:00', until: '18:00' }
const lateShift: OpeningHours = { from: '16:00', until: '00:00' }

describe('isOpenAt', () => {
  const openAtCases: Array<OpenAtCase> = [
    { name: 'is open from the first minute', hours: dayShift, at: at(8), expected: true },
    { name: 'is open in the last minute', hours: dayShift, at: at(17, 59), expected: true },
    { name: 'is closed from the closing time', hours: dayShift, at: at(18), expected: false },
    { name: 'reads 00:00 as running until midnight', hours: lateShift, at: at(23, 59), expected: true },
  ]

  it.each(openAtCases)('$name', ({ hours, at: minuteOfDay, expected }) => {
    const result = isOpenAt(hours, minuteOfDay)

    expect(result).toBe(expected)
  })
})
