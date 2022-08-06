import { expect } from 'chai'
import { isPublicUserData } from './public.js'

describe('isPublicUserData', () => {
  const min = {
    id: '0123456789abcdef12345678',
    active: true,
    admin: false
  }

  it('returns true if provided with minimum data', () => {
    expect(isPublicUserData(min)).to.equal(true)
  })

  it('returns false if given undefined', () => {
    expect(isPublicUserData(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isPublicUserData(null)).to.equal(false)
  })

  it('returns false if given a string', () => {
    expect(isPublicUserData('0123456789abcdef12345678')).to.equal(false)
  })

  it('returns false if given a number', () => {
    expect(isPublicUserData(1)).to.equal(false)
  })

  it('returns false if given true', () => {
    expect(isPublicUserData(true)).to.equal(false)
  })

  it('returns false if given false', () => {
    expect(isPublicUserData(false)).to.equal(false)
  })

  it('returns false if given an array', () => {
    expect(isPublicUserData([])).to.equal(false)
  })

  it('returns false if id is a number', () => {
    const cpy = Object.assign({}, min, { id: 42 })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if id is true', () => {
    const cpy = Object.assign({}, min, { id: true })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if id is false', () => {
    const cpy = Object.assign({}, min, { id: false })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if id is an object', () => {
    const cpy = Object.assign({}, min, { id: {} })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if id is an array', () => {
    const cpy = Object.assign({}, min, { id: [] })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns true if active is true', () => {
    const cpy = Object.assign({}, min, { active: true })
    expect(isPublicUserData(cpy)).to.equal(true)
  })

  it('returns true if active is false', () => {
    const cpy = Object.assign({}, min, { active: false })
    expect(isPublicUserData(cpy)).to.equal(true)
  })

  it('returns false if active is a string', () => {
    const cpy = Object.assign({}, min, { active: 'true' })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if active is a number', () => {
    const cpy = Object.assign({}, min, { active: 1 })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if active is an object', () => {
    const cpy = Object.assign({}, min, { active: {} })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if active is an array', () => {
    const cpy = Object.assign({}, min, { active: [] })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns true if admin is true', () => {
    const cpy = Object.assign({}, min, { admin: true })
    expect(isPublicUserData(cpy)).to.equal(true)
  })

  it('returns true if admin is false', () => {
    const cpy = Object.assign({}, min, { admin: false })
    expect(isPublicUserData(cpy)).to.equal(true)
  })

  it('returns false if admin is a string', () => {
    const cpy = Object.assign({}, min, { admin: 'true' })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is a number', () => {
    const cpy = Object.assign({}, min, { admin: 1 })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is an object', () => {
    const cpy = Object.assign({}, min, { admin: {} })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if admin is an array', () => {
    const cpy = Object.assign({}, min, { admin: [] })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if given an _id', () => {
    const cpy = Object.assign({}, min, { _id: 'test' })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if given a password', () => {
    const cpy = Object.assign({}, min, { password: 'this is a password' })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if given emails', () => {
    const cpy = Object.assign({}, min, { emails: [] })
    expect(isPublicUserData(cpy)).to.equal(false)
  })

  it('returns false if given otp', () => {
    const cpy = Object.assign({}, min, { otp: { enabled: true } })
    expect(isPublicUserData(cpy)).to.equal(false)
  })
})
