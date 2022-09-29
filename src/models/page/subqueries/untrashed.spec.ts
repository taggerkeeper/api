import { expect } from 'chai'
import User from '../../user/user.js'
import getUntrashedSubquery from './untrashed.js'

describe('getUntrashedSubquery', () => {
  it('returns a subquery that excludes any trashed page', () => {
    expect(JSON.stringify(getUntrashedSubquery())).to.equal('{"trashed":{"$exists":false}}')
  })

  it('returns false if given an admin', () => {
    const admin = new User({ name: 'Admin', admin: true })
    expect(getUntrashedSubquery(admin)).to.equal(false)
  })
})
