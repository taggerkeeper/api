import { expect } from 'chai'
import checkAny from './check-any.js'

describe('checkAny', () => {
  it('returns true if any statements are true', () => {
    const actual = checkAny([true, false, 1 + 1 === 3])
    expect(actual).to.equal(true)
  })

  it('returns false if all statements are false', () => {
    const actual = checkAny([false, false, 1 + 1 === 3])
    expect(actual).to.equal(false)
  })
})
