import { expect } from 'chai'
import { PermissionLevel } from '../permissions/data.js'
import { isRevisionData } from './data.js'

describe('isRevisionData', () => {
  const min = {
    content: {
      title: 'Title',
      body: 'This is the body.'
    },
    permissions: {
      read: PermissionLevel.anyone,
      write: PermissionLevel.anyone
    },
    timestamp: new Date('1 August 2022')
  }

  it('returns true if given an object with minimum values', () => {
    expect(isRevisionData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isRevisionData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isRevisionData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isRevisionData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isRevisionData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isRevisionData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isRevisionData([])).to.equal(false)
  })

  it('returns false if given a string for content', () => {
    const cpy = Object.assign({}, min, { content: 'Hello, world!' })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for content', () => {
    const cpy = Object.assign({}, min, { content: 42 })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for content', () => {
    const cpy = Object.assign({}, min, { content: true })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for content', () => {
    const cpy = Object.assign({}, min, { content: false })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for content that isn\'t ContentData', () => {
    const cpy = Object.assign({}, min, { content: { name: 'Title', content: 'Yup!' } })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for content', () => {
    const cpy = Object.assign({}, min, { content: [] })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a string for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: 'Hello, world!' })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: 42 })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: true })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: false })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for permissions that isn\'t PermissionsDate', () => {
    const cpy = Object.assign({}, min, { permissions: { code: '777' } })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: [] })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given UserData for editor', () => {
    const cpy = Object.assign({}, min, { editor: { name: 'Editor' } })
    expect(isRevisionData(cpy)).to.equal(true)
  })

  it('returns true if given a string for editor', () => {
    const cpy = Object.assign({}, min, { editor: '0123456789abcdef12345678' })
    expect(isRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a number for editor', () => {
    const cpy = Object.assign({}, min, { editor: 42 })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for editor', () => {
    const cpy = Object.assign({}, min, { editor: true })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for editor', () => {
    const cpy = Object.assign({}, min, { editor: false })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given an object for editor', () => {
    const cpy = Object.assign({}, min, { editor: { emails: '777' } })
    expect(isRevisionData(cpy)).to.equal(true)
  })

  it('returns true if given a string for msg', () => {
    const cpy = Object.assign({}, min, { msg: 'This is a revision.' })
    expect(isRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a number for msg', () => {
    const cpy = Object.assign({}, min, { msg: 42 })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for msg', () => {
    const cpy = Object.assign({}, min, { msg: true })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for msg', () => {
    const cpy = Object.assign({}, min, { msg: false })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for msg', () => {
    const cpy = Object.assign({}, min, { msg: {} })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for msg', () => {
    const cpy = Object.assign({}, min, { msg: [] })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a string for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: '1 August 2022' })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for msg', () => {
    const cpy = Object.assign({}, min, { timestamp: 1659312000000 })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: true })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: false })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for timestamp that isn\'t a Date', () => {
    const cpy = Object.assign({}, min, { timestamp: {} })
    expect(isRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: [] })
    expect(isRevisionData(cpy)).to.equal(false)
  })
})
