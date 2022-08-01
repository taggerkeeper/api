import { expect } from 'chai'
import { isEmailData } from './data.js'

describe('isEmailData', () => {
  it('returns true for an empty object', () => {
    expect(isEmailData({})).to.equal(true)
  })

  it('returns true if given a string for addr', () => {
    expect(isEmailData({ addr: 'test' })).to.equal(true)
  })

  it('returns false if given a number for addr', () => {
    expect(isEmailData({ addr: 42 })).to.equal(false)
  })

  it('returns false if given a boolean for addr', () => {
    expect(isEmailData({ addr: true })).to.equal(false)
  })

  it('returns false if given an object for addr', () => {
    expect(isEmailData({ addr: {} })).to.equal(false)
  })

  it('returns false if given an array for addr', () => {
    expect(isEmailData({ addr: [] })).to.equal(false)
  })

  it('returns true if given true for verified', () => {
    expect(isEmailData({ verified: true })).to.equal(true)
  })

  it('returns true if given false for verified', () => {
    expect(isEmailData({ verified: false })).to.equal(true)
  })

  it('returns false if given a string for verified', () => {
    expect(isEmailData({ verified: 'test' })).to.equal(false)
  })

  it('returns false if given a number for verified', () => {
    expect(isEmailData({ verified: 42 })).to.equal(false)
  })

  it('returns false if given an object for verified', () => {
    expect(isEmailData({ verified: {} })).to.equal(false)
  })

  it('returns false if given an array for verified', () => {
    expect(isEmailData({ verified: [] })).to.equal(false)
  })

  it('returns true if given a string for code', () => {
    expect(isEmailData({ code: 'test' })).to.equal(true)
  })

  it('returns false if given a number for code', () => {
    expect(isEmailData({ code: 42 })).to.equal(false)
  })

  it('returns false if given a boolean for code', () => {
    expect(isEmailData({ code: true })).to.equal(false)
  })

  it('returns false if given an object for code', () => {
    expect(isEmailData({ code: {} })).to.equal(false)
  })

  it('returns false if given an array for code', () => {
    expect(isEmailData({ code: [] })).to.equal(false)
  })
})
