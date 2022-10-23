import { expect } from 'chai'
import isPopulatedArray from './is-populated-array.js'

describe('isPopulatedArray', () => {
  it('returns false if given undefined', () => {
    expect(isPopulatedArray(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isPopulatedArray(null)).to.equal(false)
  })

  it('returns false if given true', () => {
    expect(isPopulatedArray(true)).to.equal(false)
  })

  it('returns false if given false', () => {
    expect(isPopulatedArray(false)).to.equal(false)
  })

  it('returns false if given a number', () => {
    expect(isPopulatedArray(1)).to.equal(false)
  })

  it('returns false if given a string', () => {
    expect(isPopulatedArray('test')).to.equal(false)
  })

  it('returns false if given an object', () => {
    expect(isPopulatedArray({})).to.equal(false)
  })

  it('returns false if given an empty array', () => {
    expect(isPopulatedArray([])).to.equal(false)
  })

  it('returns true if given an array that is not empty', () => {
    expect(isPopulatedArray([1])).to.equal(true)
  })
})