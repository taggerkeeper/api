import { expect } from 'chai'
import { PermissionLevel } from '../permissions/data.js'
import { isPublicRevisionData } from './public.js'

describe('isPublicRevisionData', () => {
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

  const fileData: any = { location: '/path/to/file.txt', key: 'file.txt', mime: 'text/plain', size: 12345 }

  it('returns true if given an object with minimum values', () => {
    expect(isPublicRevisionData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isPublicRevisionData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isPublicRevisionData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isPublicRevisionData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isPublicRevisionData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isPublicRevisionData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isPublicRevisionData([])).to.equal(false)
  })

  it('returns false if given a string for content', () => {
    const cpy = Object.assign({}, min, { content: 'Hello, world!' })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for content', () => {
    const cpy = Object.assign({}, min, { content: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for content', () => {
    const cpy = Object.assign({}, min, { content: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for content', () => {
    const cpy = Object.assign({}, min, { content: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for content that isn\'t ContentData', () => {
    const cpy = Object.assign({}, min, { content: { name: 'Title', content: 'Yup!' } })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for content', () => {
    const cpy = Object.assign({}, min, { content: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a string for file', () => {
    const cpy = Object.assign({}, min, { file: 'Hello, world!' })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for file', () => {
    const cpy = Object.assign({}, min, { file: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for file', () => {
    const cpy = Object.assign({}, min, { file: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for file', () => {
    const cpy = Object.assign({}, min, { file: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for file that isn\'t FileData', () => {
    const cpy = Object.assign({}, min, { file: { name: 'Title', content: 'Yup!' } })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for file', () => {
    const cpy = Object.assign({}, min, { file: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given a FileData for file', () => {
    const cpy = Object.assign({}, min, { file: fileData })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a string for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: 'Hello, world!' })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for thumbnail that isn\'t FileData', () => {
    const cpy = Object.assign({}, min, { thumbnail: { name: 'Title', content: 'Yup!' } })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given a FileData for thumbnail', () => {
    const cpy = Object.assign({}, min, { thumbnail: fileData })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a string for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: 'Hello, world!' })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for permissions that isn\'t PermissionsDate', () => {
    const cpy = Object.assign({}, min, { permissions: { code: '777' } })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for permissions', () => {
    const cpy = Object.assign({}, min, { permissions: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given UserData for editor', () => {
    const cpy = Object.assign({}, min, { editor: { name: 'Editor' } })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns true if given a string for editor', () => {
    const cpy = Object.assign({}, min, { editor: '0123456789abcdef12345678' })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a number for editor', () => {
    const cpy = Object.assign({}, min, { editor: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for editor', () => {
    const cpy = Object.assign({}, min, { editor: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for editor', () => {
    const cpy = Object.assign({}, min, { editor: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns true if given an object for editor', () => {
    const cpy = Object.assign({}, min, { editor: { emails: '777' } })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns true if given a string for msg', () => {
    const cpy = Object.assign({}, min, { msg: 'This is a revision.' })
    expect(isPublicRevisionData(cpy)).to.equal(true)
  })

  it('returns false if given a number for msg', () => {
    const cpy = Object.assign({}, min, { msg: 42 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for msg', () => {
    const cpy = Object.assign({}, min, { msg: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for msg', () => {
    const cpy = Object.assign({}, min, { msg: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for msg', () => {
    const cpy = Object.assign({}, min, { msg: {} })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for msg', () => {
    const cpy = Object.assign({}, min, { msg: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a string for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: '1 August 2022' })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given a number for msg', () => {
    const cpy = Object.assign({}, min, { timestamp: 1659312000000 })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given true for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: true })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given false for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: false })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an object for timestamp that isn\'t a Date', () => {
    const cpy = Object.assign({}, min, { timestamp: {} })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })

  it('returns false if given an array for timestamp', () => {
    const cpy = Object.assign({}, min, { timestamp: [] })
    expect(isPublicRevisionData(cpy)).to.equal(false)
  })
})
