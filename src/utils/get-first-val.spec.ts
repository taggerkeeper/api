import { expect } from 'chai'
import getFirstVal from './get-first-val.js'

describe('getValOrDefault', () => {
  it('returns the value if the first argument exists', () => {
    const actual = getFirstVal(42, 57)
    expect(actual).to.equal(42)
  })

  it('returns the default if the first argument does not exist', () => {
    const a1 = getFirstVal(undefined, 1)
    const a2 = getFirstVal(null, 2)
    const a3 = getFirstVal('', 3)
    expect([a1, a2, a3]).to.eql([1, 2, 3])
  })

  it('recurses until it finds an argument that exists', () => {
    const actual = getFirstVal(undefined, null, '', 42, 'nope')
    expect(actual).to.equal(42)
  })

  it('returns undefined if no argument exists', () => {
    const actual = getFirstVal(undefined, null, '', undefined)
    expect(actual).to.equal(undefined)
  })
})
