import { expect } from 'chai'
import { PermissionLevel } from '../permissions/data.js'
import { isPublicPageData } from './public.js'

describe('isPublicPageData', () => {
  const id = '0123456789abcdef12345678'
  const r2 = { content: { title: 'Updated Title', body: 'Updated content.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }, timestamp: new Date('1 August 2022') }
  const r1 = { content: { title: 'Original Title', body: 'Original content.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }, timestamp: new Date('31 July 2022') }

  it('returns true if given an object with minimum values', () => {
    expect(isPublicPageData({ revisions: [] })).to.equal(true)
  })

  it('returns false if given undefined', () => {
    expect(isPublicPageData(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isPublicPageData(null)).to.equal(false)
  })

  it('returns false for an empty object', () => {
    expect(isPublicPageData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isPublicPageData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isPublicPageData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isPublicPageData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isPublicPageData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isPublicPageData([])).to.equal(false)
  })

  it('returns true if _id is a string', () => {
    expect(isPublicPageData({ _id: id, revisions: [r2, r1] })).to.equal(true)
  })

  it('returns true if _id is an object', () => {
    expect(isPublicPageData({ _id: {}, revisions: [r2, r1] })).to.equal(true)
  })

  it('returns false if _id is a number', () => {
    expect(isPublicPageData({ _id: 12345, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if _id is true', () => {
    expect(isPublicPageData({ _id: true, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if _id is false', () => {
    expect(isPublicPageData({ _id: false, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if _id is an array', () => {
    expect(isPublicPageData({ _id: [], revisions: [r2, r1] })).to.equal(false)
  })

  it('returns true if id is a string', () => {
    expect(isPublicPageData({ id, revisions: [r2, r1] })).to.equal(true)
  })

  it('returns false if id is a number', () => {
    expect(isPublicPageData({ id: 12345, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if id is true', () => {
    expect(isPublicPageData({ id: true, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if id is false', () => {
    expect(isPublicPageData({ id: false, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if id is an object', () => {
    expect(isPublicPageData({ id: {}, revisions: [r2, r1] })).to.equal(false)
  })

  it('returns false if id is an array', () => {
    expect(isPublicPageData({ id: [], revisions: [r2, r1] })).to.equal(false)
  })

  it('returns true if all revisions are instances of RevisionData', () => {
    expect(isPublicPageData({ revisions: [r2, r1] })).to.equal(true)
  })

  it('returns false if any revisions aren\'t instances of RevisionData', () => {
    expect(isPublicPageData({ revisions: [r2, { content: 'Hello, world!' }, r1] })).to.equal(false)
  })

  it('returns false if given a string for revisions', () => {
    expect(isPublicPageData({ revisions: 'history' })).to.equal(false)
  })

  it('returns false if given a number for revisions', () => {
    expect(isPublicPageData({ revisions: 42 })).to.equal(false)
  })

  it('returns false if given true for revisions', () => {
    expect(isPublicPageData({ revisions: true })).to.equal(false)
  })

  it('returns false if given false for revisions', () => {
    expect(isPublicPageData({ revisions: false })).to.equal(false)
  })

  it('returns false if given an object for revisions', () => {
    expect(isPublicPageData({ revisions: {} })).to.equal(false)
  })

  it('returns true if given a Date for created', () => {
    expect(isPublicPageData({ revisions: [], created: new Date('31 July 2022') })).to.equal(true)
  })

  it('returns false if given a string for created', () => {
    expect(isPublicPageData({ revisions: [], created: '31 July 2022' })).to.equal(false)
  })

  it('returns false if given a number for created', () => {
    expect(isPublicPageData({ revisions: [], created: 1659225600000 })).to.equal(false)
  })

  it('returns false if given true for created', () => {
    expect(isPublicPageData({ revisions: [], created: true })).to.equal(false)
  })

  it('returns false if given false for created', () => {
    expect(isPublicPageData({ revisions: [], created: false })).to.equal(false)
  })

  it('returns false if given an object for created that isn\'t a Date', () => {
    expect(isPublicPageData({ revisions: [], created: {} })).to.equal(false)
  })

  it('returns false if given an array for created', () => {
    expect(isPublicPageData({ revisions: [], created: [] })).to.equal(false)
  })

  it('returns true if given a Date for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: new Date('1 August 2022') })).to.equal(true)
  })

  it('returns false if given a string for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: '1 August 2022' })).to.equal(false)
  })

  it('returns false if given a number for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: 1659312000000 })).to.equal(false)
  })

  it('returns false if given true for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: true })).to.equal(false)
  })

  it('returns false if given false for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: false })).to.equal(false)
  })

  it('returns false if given an object for updated that isn\'t a Date', () => {
    expect(isPublicPageData({ revisions: [], updated: {} })).to.equal(false)
  })

  it('returns false if given an array for updated', () => {
    expect(isPublicPageData({ revisions: [], updated: [] })).to.equal(false)
  })

  it('returns true if given a Date for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: new Date('2 August 2022') })).to.equal(true)
  })

  it('returns false if given a string for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: '2 August 2022' })).to.equal(false)
  })

  it('returns false if given a number for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: 1659398400000 })).to.equal(false)
  })

  it('returns false if given true for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: true })).to.equal(false)
  })

  it('returns false if given false for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: false })).to.equal(false)
  })

  it('returns false if given an object for trashed that isn\'t a Date', () => {
    expect(isPublicPageData({ revisions: [], trashed: {} })).to.equal(false)
  })

  it('returns false if given an array for trashed', () => {
    expect(isPublicPageData({ revisions: [], trashed: [] })).to.equal(false)
  })
})
