import { expect } from 'chai'
import andStr from './and-str.js'

describe('andStr', () => {
  it('returns a null string if given an empty array', () => {
    expect(andStr([])).to.equal('')
  })

  it('returns the single item if given an array with just one item', () => {
    expect(andStr(['one'])).to.equal('one')
  })

  it('returns two items with an \'and\' if given an array with two items', () => {
    expect(andStr(['one', 'two'])).to.equal('one and two')
  })

  it('returns a list if given three or more items (with Oxford comma, of course; we\'re not monsters)', () => {
    expect(andStr(['one', 'two', 'three'])).to.equal('one, two, and three')
  })

  it('can optionally take a different conjunction', () => {
    expect(andStr(['one', 'two', 'three'], 'or')).to.equal('one, two, or three')
  })
})
