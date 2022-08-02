import { expect } from 'chai'
import { isSessionData } from './data.js'

describe('isSessionData', () => {
  const minUser = { active: true, admin: false, emails: [], otp: { enabled: false } }
  const uid = '0123456789abcdef12345678'
  const _id = '12345678abcdef0123456789'

  it('returns true if given an object with a user', () => {
    expect(isSessionData({ user: minUser })).to.equal(true)
  })

  it('returns true if given a user ID', () => {
    expect(isSessionData({ user: uid })).to.equal(true)
  })

  it('returns false if given a number for user', () => {
    expect(isSessionData({ user: 42 })).to.equal(false)
  })

  it('returns false if given true for user', () => {
    expect(isSessionData({ user: true })).to.equal(false)
  })

  it('returns false if given false for user', () => {
    expect(isSessionData({ user: false })).to.equal(false)
  })

  it('returns false if given an array for user', () => {
    expect(isSessionData({ user: [] })).to.equal(false)
  })

  it('returns true if given a string as an ID and an object with a user', () => {
    expect(isSessionData({ _id, user: minUser })).to.equal(true)
  })

  it('returns true if given a string as an ID and a user ID', () => {
    expect(isSessionData({ _id, user: uid })).to.equal(true)
  })

  it('returns true if given an object as an ID and an object with a user', () => {
    expect(isSessionData({ _id: {}, user: minUser })).to.equal(true)
  })

  it('returns true if given an object as an ID and a user ID', () => {
    expect(isSessionData({ _id: {}, user: uid })).to.equal(true)
  })

  it('returns false if given a number as an ID', () => {
    expect(isSessionData({ _id: 12345, user: uid })).to.equal(false)
  })

  it('returns false if given true as an ID', () => {
    expect(isSessionData({ _id: true, user: uid })).to.equal(false)
  })

  it('returns false if given false as an ID', () => {
    expect(isSessionData({ _id: false, user: uid })).to.equal(false)
  })

  it('returns false if given an array as an ID', () => {
    expect(isSessionData({ _id: [], user: uid })).to.equal(false)
  })
})
