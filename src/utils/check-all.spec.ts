import { expect } from 'chai'
import checkAll from './check-all.js'

describe('checkAll', () => {
  it('returns true if all statements are true', () => {
    const actual = checkAll([true, !false, 1 + 1 === 2])
    expect(actual).to.equal(true)
  })

  it('returns false if any statements are false', () => {
    const actual = checkAll([true, false, 1 + 1 === 2])
    expect(actual).to.equal(false)
  })
})
