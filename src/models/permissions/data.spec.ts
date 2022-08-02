import { expect } from 'chai'
import { PermissionLevel, isPermissionsData } from './data.js'

describe('isPermissionsData', () => {
  const min = {
    read: PermissionLevel.anyone,
    write: PermissionLevel.anyone
  }

  it('returns true if given an object with minimum values', () => {
    expect(isPermissionsData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isPermissionsData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isPermissionsData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isPermissionsData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isPermissionsData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isPermissionsData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isPermissionsData([])).to.equal(false)
  })

  it('returns true if given \'authenticated\' for read', () => {
    const cpy = Object.assign({}, min, { read: PermissionLevel.authenticated })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns true if given \'editor\' for read', () => {
    const cpy = Object.assign({}, min, { read: PermissionLevel.editor })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns true if given \'admin\' for read', () => {
    const cpy = Object.assign({}, min, { read: PermissionLevel.admin })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns false if given any other string for read', () => {
    const cpy = Object.assign({}, min, { read: '777' })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given a number for read', () => {
    const cpy = Object.assign({}, min, { read: 777 })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given true for read', () => {
    const cpy = Object.assign({}, min, { read: true })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given false for read', () => {
    const cpy = Object.assign({}, min, { read: false })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given an object for read', () => {
    const cpy = Object.assign({}, min, { read: { anon: true, authenticated: true, editor: true, admin: true } })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given an array for read', () => {
    const cpy = Object.assign({}, min, { read: [true, true, true, true] })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns true if given \'authenticated\' for write', () => {
    const cpy = Object.assign({}, min, { write: PermissionLevel.authenticated })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns true if given \'editor\' for write', () => {
    const cpy = Object.assign({}, min, { write: PermissionLevel.editor })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns true if given \'admin\' for write', () => {
    const cpy = Object.assign({}, min, { write: PermissionLevel.admin })
    expect(isPermissionsData(cpy)).to.equal(true)
  })

  it('returns false if given any other string for write', () => {
    const cpy = Object.assign({}, min, { write: '777' })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given a number for write', () => {
    const cpy = Object.assign({}, min, { write: 777 })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given true for write', () => {
    const cpy = Object.assign({}, min, { write: true })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given false for write', () => {
    const cpy = Object.assign({}, min, { write: false })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given an object for write', () => {
    const cpy = Object.assign({}, min, { write: { anon: true, authenticated: true, editor: true, admin: true } })
    expect(isPermissionsData(cpy)).to.equal(false)
  })

  it('returns false if given an array for write', () => {
    const cpy = Object.assign({}, min, { write: [true, true, true, true] })
    expect(isPermissionsData(cpy)).to.equal(false)
  })
})
