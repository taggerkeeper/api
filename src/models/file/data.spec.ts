import { expect } from 'chai'
import { isFileData } from './data.js'

describe('isFileData', () => {
  const min: any = { location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 }

  it('returns true if given a valid object', () => {
    expect(isFileData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isFileData({})).to.equal(false)
  })

  it('returns false if given undefined', () => {
    expect(isFileData(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isFileData(null)).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isFileData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isFileData(42)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isFileData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isFileData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isFileData([])).to.equal(false)
  })

  it('returns false if not given a location', () => {
    const cpy = Object.assign({}, min)
    delete cpy.location
    expect(isFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for location', () => {
    expect(isFileData(Object.assign({}, min, { location: 42 }))).to.equal(false)
  })

  it('returns false if given true for location', () => {
    expect(isFileData(Object.assign({}, min, { location: true }))).to.equal(false)
  })

  it('returns false if given false for location', () => {
    expect(isFileData(Object.assign({}, min, { location: false }))).to.equal(false)
  })

  it('returns false if given an object for location', () => {
    expect(isFileData(Object.assign({}, min, { location: {} }))).to.equal(false)
  })

  it('returns false if given an array for location', () => {
    expect(isFileData(Object.assign({}, min, { location: [] }))).to.equal(false)
  })

  it('returns false if not given a key', () => {
    const cpy = Object.assign({}, min)
    delete cpy.key
    expect(isFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for key', () => {
    expect(isFileData(Object.assign({}, min, { key: 42 }))).to.equal(false)
  })

  it('returns false if given true for key', () => {
    expect(isFileData(Object.assign({}, min, { key: true }))).to.equal(false)
  })

  it('returns false if given false for key', () => {
    expect(isFileData(Object.assign({}, min, { key: false }))).to.equal(false)
  })

  it('returns false if given an object for key', () => {
    expect(isFileData(Object.assign({}, min, { key: {} }))).to.equal(false)
  })

  it('returns false if given an array for key', () => {
    expect(isFileData(Object.assign({}, min, { key: [] }))).to.equal(false)
  })

  it('returns false if not given a mime', () => {
    const cpy = Object.assign({}, min)
    delete cpy.mime
    expect(isFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for mime', () => {
    expect(isFileData(Object.assign({}, min, { mime: 42 }))).to.equal(false)
  })

  it('returns false if given true for mime', () => {
    expect(isFileData(Object.assign({}, min, { mime: true }))).to.equal(false)
  })

  it('returns false if given false for mime', () => {
    expect(isFileData(Object.assign({}, min, { mime: false }))).to.equal(false)
  })

  it('returns false if given an object for mime', () => {
    expect(isFileData(Object.assign({}, min, { mime: {} }))).to.equal(false)
  })

  it('returns false if given an array for mime', () => {
    expect(isFileData(Object.assign({}, min, { mime: [] }))).to.equal(false)
  })

  it('returns false if not given a size', () => {
    const cpy = Object.assign({}, min)
    delete cpy.size
    expect(isFileData(cpy)).to.equal(false)
  })

  it('returns false if given a string for size', () => {
    expect(isFileData(Object.assign({}, min, { size: 'test' }))).to.equal(false)
  })

  it('returns false if given true for size', () => {
    expect(isFileData(Object.assign({}, min, { size: true }))).to.equal(false)
  })

  it('returns false if given false for size', () => {
    expect(isFileData(Object.assign({}, min, { size: false }))).to.equal(false)
  })

  it('returns false if given an object for size', () => {
    expect(isFileData(Object.assign({}, min, { size: {} }))).to.equal(false)
  })

  it('returns false if given an array for size', () => {
    expect(isFileData(Object.assign({}, min, { size: [] }))).to.equal(false)
  })
})
