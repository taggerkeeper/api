import { expect } from 'chai'
import pickRandomElem from './pick-random-elem.js'

describe('pickRandomElem', () => {
  it('picks a random element from the array', () => {
    const arr = [1, 2, 3, 4, 5]
    const actual = pickRandomElem(arr)
    expect(arr).to.include(actual)
  })
})
