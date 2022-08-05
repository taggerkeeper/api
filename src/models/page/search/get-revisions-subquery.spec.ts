import { expect } from 'chai'
import getRevisionsSubquery from './get-revisions-subquery.js'

describe('getRevisionsSubquery', () => {
  it('returns false if not given a query', () => {
    expect(getRevisionsSubquery()).to.equal(false)
  })

  it('returns false if not undefined as a query', () => {
    expect(getRevisionsSubquery(undefined)).to.equal(false)
  })

  it('returns a subquery for maximum number of revisions', () => {
    const json = JSON.stringify(getRevisionsSubquery({ revisions: { max: 5 } }))
    expect(json).to.equal('{"revisions.5":{"$exists":false}}')
  })

  it('returns a subquery for minimum number of revisions', () => {
    const json = JSON.stringify(getRevisionsSubquery({ revisions: { min: 2 } }))
    expect(json).to.equal('{"revisions.1":{"$exists":true}}')
  })

  it('returns a subquery for both minimum and maximum number of revisions', () => {
    const json = JSON.stringify(getRevisionsSubquery({ revisions: { min: 2, max: 5 } }))
    expect(json).to.equal('{"revisions.5":{"$exists":false},"revisions.1":{"$exists":true}}')
  })
})
