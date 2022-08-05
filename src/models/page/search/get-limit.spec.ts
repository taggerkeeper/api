import { expect } from 'chai'
import getLimit from './get-limit.js'

describe('getLimit', () => {
  it('returns the limit provided if it\'s less than the maximum', () => {
    expect(getLimit(25)).to.equal(25)
  })

  it('returns the maximum if you request something beyond that', () => {
    expect(getLimit(1000000)).to.equal(1000)
  })

  it('returns the default if not given an argument', () => {
    expect(getLimit()).to.equal(50)
  })

  it('returns the default if given undefined as an argument', () => {
    expect(getLimit(undefined)).to.equal(50)
  })

  it('respects the default set by environment', () => {
    process.env.DEFAULT_QUERY_LIMIT = '75'
    expect(getLimit()).to.equal(75)
    delete process.env.DEFAULT_QUERY_LIMIT
  })

  it('respects the maximum set by environment', () => {
    process.env.MAX_QUERY_LIMIT = '30'
    expect(getLimit()).to.equal(30)
    delete process.env.MAX_QUERY_LIMIT
  })
})
