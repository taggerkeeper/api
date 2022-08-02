import { expect } from 'chai'
import { isPasswordResetData } from './data.js'

describe('isPasswordResetData', () => {
  const data = {
    user: {
      active: true,
      admin: false,
      emails: [{ addr: 'test@testing.com', verified: true }],
      otp: { enabled: false }
    },
    email: { addr: 'test@testing.com', verified: true },
    code: 'abc123',
    expiration: new Date('1 August 2022')
  }

  it('returns true if given an object with minimum values', () => {
    expect(isPasswordResetData(data)).to.equal(true)
  })

  it('returns false if given a string', () => {
    expect(isPasswordResetData('data')).to.equal(false)
  })

  it('returns false if given a number', () => {
    expect(isPasswordResetData(1)).to.equal(false)
  })

  it('returns false if given true', () => {
    expect(isPasswordResetData(true)).to.equal(false)
  })

  it('returns false if given false', () => {
    expect(isPasswordResetData(false)).to.equal(false)
  })

  it('returns false if given an empty object', () => {
    expect(isPasswordResetData({})).to.equal(false)
  })

  it('returns false if given an array', () => {
    expect(isPasswordResetData([])).to.equal(false)
  })

  it('returns true if given a string for user', () => {
    const cpy = Object.assign({}, data, { user: 'userID' })
    expect(isPasswordResetData(cpy)).to.equal(true)
  })

  it('returns false if given a number for user', () => {
    const cpy = Object.assign({}, data, { user: 1 })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given true for user', () => {
    const cpy = Object.assign({}, data, { user: true })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given false for user', () => {
    const cpy = Object.assign({}, data, { user: false })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an object for user that isn\'t UserData', () => {
    const cpy = Object.assign({}, data, { user: {} })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an array for user', () => {
    const cpy = Object.assign({}, data, { user: [] })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given a string for email', () => {
    const cpy = Object.assign({}, data, { email: 'test@testing.com' })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given a number for email', () => {
    const cpy = Object.assign({}, data, { email: 1 })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given true for email', () => {
    const cpy = Object.assign({}, data, { email: true })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given false for email', () => {
    const cpy = Object.assign({}, data, { email: false })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an object for email that isn\'t EmailData', () => {
    const cpy = Object.assign({}, data, { email: { addr: 1, verified: 'true' } })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an array for email', () => {
    const cpy = Object.assign({}, data, { email: [] })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given a number for code', () => {
    const cpy = Object.assign({}, data, { code: 1 })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given true for code', () => {
    const cpy = Object.assign({}, data, { code: true })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given false for code', () => {
    const cpy = Object.assign({}, data, { code: false })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an object for code', () => {
    const cpy = Object.assign({}, data, { code: {} })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an array for code', () => {
    const cpy = Object.assign({}, data, { code: [] })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given a string for expiration', () => {
    const cpy = Object.assign({}, data, { expiration: 1 })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given a number for expiration', () => {
    const cpy = Object.assign({}, data, { expiration: 1 })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given true for expiration', () => {
    const cpy = Object.assign({}, data, { expiration: true })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given false for expiration', () => {
    const cpy = Object.assign({}, data, { expiration: false })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an object for expiration that isn\'t a Date', () => {
    const cpy = Object.assign({}, data, { expiration: {} })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })

  it('returns false if given an array for expiration', () => {
    const cpy = Object.assign({}, data, { expiration: [] })
    expect(isPasswordResetData(cpy)).to.equal(false)
  })
})
