import { expect } from 'chai'
import { isOTPData } from './data.js'

describe('isOTPData', () => {
  it('returns true if enabled is true', () => {
    expect(isOTPData({ enabled: true })).to.equal(true)
  })

  it('returns true if enabled is false', () => {
    expect(isOTPData({ enabled: false })).to.equal(true)
  })

  it('returns false if enabled is a string', () => {
    expect(isOTPData({ enabled: 'true' })).to.equal(false)
  })

  it('returns false if enabled is a number', () => {
    expect(isOTPData({ enabled: 1 })).to.equal(false)
  })

  it('returns false if enabled is an object', () => {
    expect(isOTPData({ enabled: {} })).to.equal(false)
  })

  it('returns false if enabled is an array', () => {
    expect(isOTPData({ enabled: [] })).to.equal(false)
  })

  it('returns true if secret is a string', () => {
    expect(isOTPData({ enabled: true, secret: 'shhhh' })).to.equal(true)
  })

  it('returns false if secret is a number', () => {
    expect(isOTPData({ enabled: true, secret: 42 })).to.equal(false)
  })

  it('returns false if secret is true', () => {
    expect(isOTPData({ enabled: true, secret: true })).to.equal(false)
  })

  it('returns false if secret is false', () => {
    expect(isOTPData({ enabled: true, secret: false })).to.equal(false)
  })

  it('returns false if secret is an object', () => {
    expect(isOTPData({ enabled: true, secret: {} })).to.equal(false)
  })

  it('returns false if secret is an array', () => {
    expect(isOTPData({ enabled: true, secret: [] })).to.equal(false)
  })
})
