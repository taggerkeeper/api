import { expect } from 'chai'
import { PermissionLevel } from '../permissions/data.js'
import { isPageData } from './data.js'

describe('isPageData', () => {
  const r2 = { content: { title: 'Updated Title', body: 'Updated content.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.authenticated }, timestamp: new Date('1 August 2022') }
  const r1 = { content: { title: 'Original Title', body: 'Original content.' }, permissions: { read: PermissionLevel.anyone, write: PermissionLevel.anyone }, timestamp: new Date('31 July 2022') }

  it('returns true if given an object with minimum values', () => {
    expect(isPageData({ revisions: [] })).to.equal(true)
  })

  it('returns false if given undefined', () => {
    expect(isPageData(undefined)).to.equal(false)
  })

  it('returns false if given null', () => {
    expect(isPageData(null)).to.equal(false)
  })

  it('returns false for an empty object', () => {
    expect(isPageData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isPageData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isPageData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isPageData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isPageData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isPageData([])).to.equal(false)
  })

  it('returns true if all revisions are instances of RevisionData', () => {
    expect(isPageData({ revisions: [r2, r1] })).to.equal(true)
  })

  it('returns false if any revisions aren\'t instances of RevisionData', () => {
    expect(isPageData({ revisions: [r2, { content: 'Hello, world!' }, r1] })).to.equal(false)
  })

  it('returns false if given a string for revisions', () => {
    expect(isPageData({ revisions: 'history' })).to.equal(false)
  })

  it('returns false if given a number for revisions', () => {
    expect(isPageData({ revisions: 42 })).to.equal(false)
  })

  it('returns false if given true for revisions', () => {
    expect(isPageData({ revisions: true })).to.equal(false)
  })

  it('returns false if given false for revisions', () => {
    expect(isPageData({ revisions: false })).to.equal(false)
  })

  it('returns false if given an object for revisions', () => {
    expect(isPageData({ revisions: {} })).to.equal(false)
  })

  it('returns true if given a Date for created', () => {
    expect(isPageData({ revisions: [], created: new Date('31 July 2022') })).to.equal(true)
  })

  it('returns false if given a string for created', () => {
    expect(isPageData({ revisions: [], created: '31 July 2022' })).to.equal(false)
  })

  it('returns false if given a number for created', () => {
    expect(isPageData({ revisions: [], created: 1659225600000 })).to.equal(false)
  })

  it('returns false if given true for created', () => {
    expect(isPageData({ revisions: [], created: true })).to.equal(false)
  })

  it('returns false if given false for created', () => {
    expect(isPageData({ revisions: [], created: false })).to.equal(false)
  })

  it('returns false if given an object for created that isn\'t a Date', () => {
    expect(isPageData({ revisions: [], created: {} })).to.equal(false)
  })

  it('returns false if given an array for created', () => {
    expect(isPageData({ revisions: [], created: [] })).to.equal(false)
  })

  it('returns true if given a Date for updated', () => {
    expect(isPageData({ revisions: [], updated: new Date('1 August 2022') })).to.equal(true)
  })

  it('returns false if given a string for updated', () => {
    expect(isPageData({ revisions: [], updated: '1 August 2022' })).to.equal(false)
  })

  it('returns false if given a number for updated', () => {
    expect(isPageData({ revisions: [], updated: 1659312000000 })).to.equal(false)
  })

  it('returns false if given true for updated', () => {
    expect(isPageData({ revisions: [], updated: true })).to.equal(false)
  })

  it('returns false if given false for updated', () => {
    expect(isPageData({ revisions: [], updated: false })).to.equal(false)
  })

  it('returns false if given an object for updated that isn\'t a Date', () => {
    expect(isPageData({ revisions: [], updated: {} })).to.equal(false)
  })

  it('returns false if given an array for updated', () => {
    expect(isPageData({ revisions: [], updated: [] })).to.equal(false)
  })

  it('returns true if given a Date for trashed', () => {
    expect(isPageData({ revisions: [], trashed: new Date('2 August 2022') })).to.equal(true)
  })

  it('returns false if given a string for trashed', () => {
    expect(isPageData({ revisions: [], trashed: '2 August 2022' })).to.equal(false)
  })

  it('returns false if given a number for trashed', () => {
    expect(isPageData({ revisions: [], trashed: 1659398400000 })).to.equal(false)
  })

  it('returns false if given true for trashed', () => {
    expect(isPageData({ revisions: [], trashed: true })).to.equal(false)
  })

  it('returns false if given false for trashed', () => {
    expect(isPageData({ revisions: [], trashed: false })).to.equal(false)
  })

  it('returns false if given an object for trashed that isn\'t a Date', () => {
    expect(isPageData({ revisions: [], trashed: {} })).to.equal(false)
  })

  it('returns false if given an array for trashed', () => {
    expect(isPageData({ revisions: [], trashed: [] })).to.equal(false)
  })
})
