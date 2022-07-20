import { expect } from 'chai'
import getValOrDefault from './get-val-or-default.js'

describe('getValOrDefault', () => {
  it('returns the value if the first argument exists', () => {
    const actual = getValOrDefault(42, 57)
    expect(actual).to.equal(42)
  })

  it('returns the default if the first argument does not exist', () => {
    const a1 = getValOrDefault(undefined, 1)
    const a2 = getValOrDefault(null, 2)
    const a3 = getValOrDefault('', 3)
    expect([a1, a2, a3]).to.eql([1, 2, 3])
  })
})
