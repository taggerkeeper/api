import { expect } from 'chai'
import { isUserData } from './data.js'

describe('isUserData', () => {
  const email1 = { addr: 'test@testing.com', verified: true }
  const email2 = { addr: 'also@testing.com', verified: false, code: 'abc123' }

  const min = {
    active: true,
    admin: false,
    emails: [],
    otp: { enabled: false }
  }

  it('returns true if provided with minimum data', () => {
    expect(isUserData(min)).to.equal(true)
  })

  it('returns true if _id is a string', () => {
    const cpy = Object.assign({}, min, { _id: 'test' })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns true if _id is an object', () => {
    const cpy = Object.assign({}, min, { _id: {} })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if _id is a number', () => {
    const cpy = Object.assign({}, min, { _id: 42 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if _id is true', () => {
    const cpy = Object.assign({}, min, { _id: true })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if _id is false', () => {
    const cpy = Object.assign({}, min, { _id: false })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if _id is a number', () => {
    const cpy = Object.assign({}, min, { _id: 42 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if id is a string', () => {
    const cpy = Object.assign({}, min, { id: 'test' })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if id is a number', () => {
    const cpy = Object.assign({}, min, { id: 42 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if id is true', () => {
    const cpy = Object.assign({}, min, { id: true })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if id is false', () => {
    const cpy = Object.assign({}, min, { id: false })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if id is a number', () => {
    const cpy = Object.assign({}, min, { id: 42 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if id is an object', () => {
    const cpy = Object.assign({}, min, { id: {} })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if id is an array', () => {
    const cpy = Object.assign({}, min, { id: [] })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if active is true', () => {
    const cpy = Object.assign({}, min, { active: true })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns true if active is false', () => {
    const cpy = Object.assign({}, min, { active: false })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if active is a string', () => {
    const cpy = Object.assign({}, min, { active: 'true' })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if active is a number', () => {
    const cpy = Object.assign({}, min, { active: 1 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if active is an object', () => {
    const cpy = Object.assign({}, min, { active: {} })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if active is an array', () => {
    const cpy = Object.assign({}, min, { active: [] })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if admin is true', () => {
    const cpy = Object.assign({}, min, { admin: true })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns true if admin is false', () => {
    const cpy = Object.assign({}, min, { admin: false })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if admin is a string', () => {
    const cpy = Object.assign({}, min, { admin: 'true' })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is a number', () => {
    const cpy = Object.assign({}, min, { admin: 1 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is an object', () => {
    const cpy = Object.assign({}, min, { admin: {} })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is an array', () => {
    const cpy = Object.assign({}, min, { admin: [] })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if password is a string', () => {
    const cpy = Object.assign({}, min, { password: 'this is a password' })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if password is a number', () => {
    const cpy = Object.assign({}, min, { password: 42 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if password is true', () => {
    const cpy = Object.assign({}, min, { password: true })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if password is false', () => {
    const cpy = Object.assign({}, min, { password: false })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if password is an object', () => {
    const cpy = Object.assign({}, min, { password: {} })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if password is an array', () => {
    const cpy = Object.assign({}, min, { password: [] })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if emails is an array of EmailData', () => {
    const cpy = Object.assign({}, min, { emails: [email1, email2] })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if the emails array contains anything other than EmailData', () => {
    const cpy = Object.assign({}, min, { emails: [email1, true] })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if emails is a string', () => {
    const cpy = Object.assign({}, min, { emails: 'true' })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if emails is a number', () => {
    const cpy = Object.assign({}, min, { emails: 1 })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if emails is true', () => {
    const cpy = Object.assign({}, min, { emails: true })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if emails is false', () => {
    const cpy = Object.assign({}, min, { emails: false })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if emails is an object', () => {
    const cpy = Object.assign({}, min, { emails: {} })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if otp.enabled is true', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true } })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns true if otp.enabled is false', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: false } })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if otp.enabled is undefined', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: undefined } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.enabled is a string', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: 'true' } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.enabled is a number', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: 1 } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.enabled is an object', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: {} } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.enabled is an array', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: [] } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns true if otp.secret is a string', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: 'shhh' } })
    expect(isUserData(cpy)).to.equal(true)
  })

  it('returns false if otp.secret is a number', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: 42 } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.secret is true', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: true } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.secret is false', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: false } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.secret is an object', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: {} } })
    expect(isUserData(cpy)).to.equal(false)
  })

  it('returns false if otp.secret is an array', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true, secret: [] } })
    expect(isUserData(cpy)).to.equal(false)
  })
})
