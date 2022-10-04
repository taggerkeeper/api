import { expect } from 'chai'
import getOffsetLimitStartEnd from './get-offset-limit-start-end.js'

describe('getOffsetLimitStartEnd', () => {
  it('returns the limit provided if it\'s less than the maximum', () => {
    const actual = getOffsetLimitStartEnd({ limit: 25, trashed: false })
    expect(actual.limit).to.equal(25)
  })

  it('returns the maximum if you request something beyond that', () => {
    const actual = getOffsetLimitStartEnd({ limit: 1000000, trashed: false })
    expect(actual.limit).to.equal(1000)
  })

  it('respects the default set by environment', () => {
    process.env.DEFAULT_QUERY_LIMIT = '75'
    const actual = getOffsetLimitStartEnd({ trashed: false })
    delete process.env.DEFAULT_QUERY_LIMIT
    expect(actual.limit).to.equal(75)
  })

  it('respects the maximum set by environment', () => {
    process.env.MAX_QUERY_LIMIT = '30'
    const actual = getOffsetLimitStartEnd({ trashed: false })
    delete process.env.MAX_QUERY_LIMIT
    expect(actual.limit).to.equal(30)
  })

  it('returns an offset of zero by default', () => {
    const actual = getOffsetLimitStartEnd({ trashed: false })
    expect(actual.offset).to.equal(0)
  })

  it('returns the offset specified by the query', () => {
    const actual = getOffsetLimitStartEnd({ offset: 1000000, trashed: false })
    expect(actual.offset).to.equal(1000000)
  })

  it('returns a start equal to the offset', () => {
    const actual = getOffsetLimitStartEnd({ offset: 1000000, trashed: false })
    expect(actual.start).to.equal(1000000)
  })

  it('returns an end equal to the offset plus the limit', () => {
    const actual = getOffsetLimitStartEnd({ limit: 55, offset: 1000000, trashed: false })
    expect(actual.end).to.equal(1000054)
  })
})
