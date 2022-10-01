import { expect } from 'chai'
import getTrashedSubquery from './get-trashed-subquery.js'

describe('getTrashedSubquery', () => {
  it('returns false if not given a query', () => {
    expect(getTrashedSubquery()).to.equal(false)
  })

  it('returns false if given undefined as a query', () => {
    expect(getTrashedSubquery(undefined)).to.equal(false)
  })

  it('returns false if given a query in which trashed is false', () => {
    expect(getTrashedSubquery({ trashed: false })).to.equal(false)
  })

  it('returns a trashed search subquery', () => {
    const json = JSON.stringify(getTrashedSubquery({ trashed: true }))
    expect(json).to.equal('{"trashed":{"$exists":true,"$ne":null}}')
  })
})
