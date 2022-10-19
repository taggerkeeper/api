import { expect } from 'chai'
import { isPublicFileData } from './public.js'

describe('isPublicFileData', () => {
  const min: any = { location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: { bytes: 12345, str: '12.3 kB' } }

  it('returns true if given a valid object', () => {
    expect(isPublicFileData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isPublicFileData({})).to.equal(false)
  })

  it('returns false if given undefined', () => {
    expect(isPublicFileData(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isPublicFileData(null)).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isPublicFileData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isPublicFileData(42)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isPublicFileData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isPublicFileData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isPublicFileData([])).to.equal(false)
  })

  it('returns false if not given a location', () => {
    const cpy = Object.assign({}, min)
    delete cpy.location
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for location', () => {
    expect(isPublicFileData(Object.assign({}, min, { location: 42 }))).to.equal(false)
  })

  it('returns false if given true for location', () => {
    expect(isPublicFileData(Object.assign({}, min, { location: true }))).to.equal(false)
  })

  it('returns false if given false for location', () => {
    expect(isPublicFileData(Object.assign({}, min, { location: false }))).to.equal(false)
  })

  it('returns false if given an object for location', () => {
    expect(isPublicFileData(Object.assign({}, min, { location: {} }))).to.equal(false)
  })

  it('returns false if given an array for location', () => {
    expect(isPublicFileData(Object.assign({}, min, { location: [] }))).to.equal(false)
  })

  it('returns false if not given a key', () => {
    const cpy = Object.assign({}, min)
    delete cpy.key
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for key', () => {
    expect(isPublicFileData(Object.assign({}, min, { key: 42 }))).to.equal(false)
  })

  it('returns false if given true for key', () => {
    expect(isPublicFileData(Object.assign({}, min, { key: true }))).to.equal(false)
  })

  it('returns false if given false for key', () => {
    expect(isPublicFileData(Object.assign({}, min, { key: false }))).to.equal(false)
  })

  it('returns false if given an object for key', () => {
    expect(isPublicFileData(Object.assign({}, min, { key: {} }))).to.equal(false)
  })

  it('returns false if given an array for key', () => {
    expect(isPublicFileData(Object.assign({}, min, { key: [] }))).to.equal(false)
  })

  it('returns false if not given a mime', () => {
    const cpy = Object.assign({}, min)
    delete cpy.mime
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for mime', () => {
    expect(isPublicFileData(Object.assign({}, min, { mime: 42 }))).to.equal(false)
  })

  it('returns false if given true for mime', () => {
    expect(isPublicFileData(Object.assign({}, min, { mime: true }))).to.equal(false)
  })

  it('returns false if given false for mime', () => {
    expect(isPublicFileData(Object.assign({}, min, { mime: false }))).to.equal(false)
  })

  it('returns false if given an object for mime', () => {
    expect(isPublicFileData(Object.assign({}, min, { mime: {} }))).to.equal(false)
  })

  it('returns false if given an array for mime', () => {
    expect(isPublicFileData(Object.assign({}, min, { mime: [] }))).to.equal(false)
  })

  it('returns false if not given a size', () => {
    const cpy = Object.assign({}, min)
    delete cpy.size
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a string for size', () => {
    expect(isPublicFileData(Object.assign({}, min, { size: 'test' }))).to.equal(false)
  })

  it('returns false if given true for size', () => {
    expect(isPublicFileData(Object.assign({}, min, { size: true }))).to.equal(false)
  })

  it('returns false if given false for size', () => {
    expect(isPublicFileData(Object.assign({}, min, { size: false }))).to.equal(false)
  })

  it('returns false if given an object for size', () => {
    expect(isPublicFileData(Object.assign({}, min, { size: {} }))).to.equal(false)
  })

  it('returns false if given an array for size', () => {
    expect(isPublicFileData(Object.assign({}, min, { size: [] }))).to.equal(false)
  })

  it('returns false if not given bytes', () => {
    const cpy = Object.assign({}, min)
    delete cpy.size.bytes
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a string for bytes', () => {
    const cpy = Object.assign({}, min)
    cpy.size.bytes = '12345'
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given true for bytes', () => {
    const cpy = Object.assign({}, min)
    cpy.size.bytes = true
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given false for bytes', () => {
    const cpy = Object.assign({}, min)
    cpy.size.bytes = false
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given an object for bytes', () => {
    const cpy = Object.assign({}, min)
    cpy.size.bytes = { value: 12345 }
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given an array for bytes', () => {
    const cpy = Object.assign({}, min)
    cpy.size.bytes = [1, 2, 3, 4, 5]
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if not given a size string', () => {
    const cpy = Object.assign({}, min)
    delete cpy.size.str
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given a number for size string', () => {
    const cpy = Object.assign({}, min)
    cpy.size.str = 12345
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given true for size string', () => {
    const cpy = Object.assign({}, min)
    cpy.size.str = true
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given false for size string', () => {
    const cpy = Object.assign({}, min)
    cpy.size.str = false
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given an object for size string', () => {
    const cpy = Object.assign({}, min)
    cpy.size.str = { value: '12.3 kB' }
    expect(isPublicFileData(cpy)).to.equal(false)
  })

  it('returns false if given an array for size string', () => {
    const cpy = Object.assign({}, min)
    cpy.size.str = ['1', '2', '3', '4', '5']
    expect(isPublicFileData(cpy)).to.equal(false)
  })
})
