import { expect } from 'chai'
import User from '../../user/user.js'
import getTrashedSubquery from './get-trashed-subquery.js'

describe('getTrashedSubquery', () => {
  const user = new User()
  const admin = new User({ name: 'Admin', admin: true })

  it('returns false if not given a query', () => {
    expect(getTrashedSubquery()).to.equal(false)
  })

  it('returns false if given undefined as a query', () => {
    expect(getTrashedSubquery(undefined)).to.equal(false)
  })

  it('returns false if not given a user', () => {
    expect(getTrashedSubquery({ trashed: true })).to.equal(false)
  })

  it('returns false if not given an admin', () => {
    expect(getTrashedSubquery({ trashed: true }, user)).to.equal(false)
  })

  it('excludes trashed if requested by an admin', () => {
    const query = getTrashedSubquery({ trashed: false }, admin)
    expect(Object.keys(query).join(' ')).to.equal('trashed')
    expect(Object.keys(query.trashed).join(' ')).to.equal('$exists')
    expect(query.trashed.$exists).to.equal(false)
  })

  it('includes trashed if requested by an admin', () => {
    const query = getTrashedSubquery({ trashed: true }, admin)
    expect(Object.keys(query).join(' ')).to.equal('trashed')
    expect(Object.keys(query.trashed).join(' ')).to.equal('$exists $ne')
    expect(query.trashed.$exists).to.equal(true)
    expect(query.trashed.$ne).to.equal(null)
  })
})
