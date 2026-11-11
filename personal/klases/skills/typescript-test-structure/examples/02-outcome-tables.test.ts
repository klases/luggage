// One table per kind of outcome: each body runs a single path, so no row needs a flag like wantErr.
import { parseQuantity } from './subject/parse-quantity'

interface ParsedCase {
  name: string
  input: string
  expected: number
}

interface RejectedCase {
  name: string
  input: string
  message: string
}

describe('parseQuantity', () => {
  describe('reads', () => {
    const parsedCases: Array<ParsedCase> = [
      { name: 'reads a whole number', input: '3', expected: 3 },
      { name: 'ignores surrounding spaces', input: ' 12 ', expected: 12 },
      { name: 'accepts the lower bound', input: '1', expected: 1 },
      { name: 'accepts the upper bound', input: '99', expected: 99 },
    ]

    it.each(parsedCases)('$name', ({ input, expected }) => {
      const result = parseQuantity(input)

      expect(result).toBe(expected)
    })
  })

  describe('rejects', () => {
    const rejectedCases: Array<RejectedCase> = [
      { name: 'rejects an empty input', input: '', message: 'not a whole number' },
      { name: 'rejects a decimal', input: '1.5', message: 'not a whole number' },
      { name: 'rejects zero', input: '0', message: 'out of range 1-99: 0' },
      { name: 'rejects a quantity above the upper bound', input: '100', message: 'out of range 1-99: 100' },
    ]

    it.each(rejectedCases)('$name', ({ input, message }) => {
      const parse = () => parseQuantity(input)

      expect(parse).toThrow(message)
    })
  })
})
