import { expect } from 'chai'
import * as sinon from 'sinon'
import validatePath, { isPathValidation } from './validate-path.js'

describe('isPathValidation', () => {
  it('rejects a string', () => {
    expect(isPathValidation('hello')).to.equal(false)
  })

  it('rejects a number', () => {
    expect(isPathValidation(42)).to.equal(false)
  })

  it('rejects true', () => {
    expect(isPathValidation(true)).to.equal(false)
  })

  it('rejects false', () => {
    expect(isPathValidation(false)).to.equal(false)
  })

  it('rejects an array', () => {
    expect(isPathValidation([1, 2, 3])).to.equal(false)
  })

  it('rejects an empty object', () => {
    expect(isPathValidation({})).to.equal(false)
  })

  it('rejects a string for isValid', () => {
    expect(isPathValidation({ isValid: 'true' })).to.equal(false)
  })

  it('rejects a number for isValid', () => {
    expect(isPathValidation({ isValid: 42 })).to.equal(false)
  })

  it('rejects an array for isValid', () => {
    expect(isPathValidation({ isValid: [1, 2, 3] })).to.equal(false)
  })

  it('rejects an object for isValid', () => {
    expect(isPathValidation({ isValid: {} })).to.equal(false)
  })

  it('accepts true for isValid', () => {
    expect(isPathValidation({ isValid: true })).to.equal(true)
  })

  it('accepts false for isValid', () => {
    expect(isPathValidation({ isValid: false })).to.equal(true)
  })

  it('accepts a string for reason', () => {
    expect(isPathValidation({ isValid: false, reason: 'hello' })).to.equal(true)
  })

  it('rejects a number for reason', () => {
    expect(isPathValidation({ isValid: false, reason: 42 })).to.equal(false)
  })

  it('rejects true for reason', () => {
    expect(isPathValidation({ isValid: false, reason: true })).to.equal(false)
  })

  it('rejects false for reason', () => {
    expect(isPathValidation({ isValid: false, reason: false })).to.equal(false)
  })

  it('rejects an array for reason', () => {
    expect(isPathValidation({ isValid: false, reason: [1, 2, 3] })).to.equal(false)
  })

  it('rejects an object for reason', () => {
    expect(isPathValidation({ isValid: false, reason: {} })).to.equal(false)
  })
})

describe('validatePath', () => {
  afterEach(() => { sinon.restore() })

  it('rejects an empty string', () => {
    const actual = validatePath('')
    expect(actual.isValid).to.equal(false)
    expect(actual.reason).to.equal('A null string is not a valid path.')
  })

  it('rejects paths that begin with reserved words', () => {
    const actual = validatePath('/login/more')
    expect(actual.isValid).to.equal(false)
    expect(actual.reason).to.equal('First element cannot be any of login, logout, dashboard, or connect.')
  })

  it('accepts valid paths', async () => {
    const actual = validatePath('/test')
    expect(actual.isValid).to.equal(true)
    expect(actual.reason).to.equal(undefined)
  })
})
