import exists from './exists.js'
import { expect } from 'chai'

describe('exists', () => {
  it('returns false if given undefined', () => {
    expect(exists(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(exists(null)).to.equal(false)
  })

  it('returns false if given a null string', () => {
    expect(exists('')).to.equal(false)
  })

  it('returns true if given a string', () => {
    expect(exists('hello world')).to.equal(true)
  })

  it('returns true if given a number', () => {
    expect(exists(42)).to.equal(true)
  })

  it('returns true if given an object', () => {
    expect(exists({ a: 42 })).to.equal(true)
  })

  it('returns true if given a defined object property', () => {
    const obj = { a: 42 }
    expect(exists(obj?.a)).to.equal(true)
  })

  it('returns false if given an undefined object property', () => {
    const obj: { a?: number } = {}
    expect(exists(obj?.a)).to.equal(false)
  })

  it('returns true if given the boolean false', () => {
    expect(exists(false)).to.equal(true)
  })
})
