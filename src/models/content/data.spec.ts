import { expect } from 'chai'
import { isContentData } from './data.js'

describe('isContentData', () => {
  const min = {
    title: 'Title',
    body: 'This is the body.'
  }

  it('returns true if given an object with minimum values', () => {
    expect(isContentData(min)).to.equal(true)
  })

  it('returns false for an empty object', () => {
    expect(isContentData({})).to.equal(false)
  })

  it('returns false for a string', () => {
    expect(isContentData('true')).to.equal(false)
  })

  it('returns false for a number', () => {
    expect(isContentData(1)).to.equal(false)
  })

  it('returns false for true', () => {
    expect(isContentData(true)).to.equal(false)
  })

  it('returns false for false', () => {
    expect(isContentData(false)).to.equal(false)
  })

  it('returns false for an array', () => {
    expect(isContentData([])).to.equal(false)
  })

  it('returns false if given a number for title', () => {
    const cpy = Object.assign({}, min, { title: 1 })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given true for title', () => {
    const cpy = Object.assign({}, min, { title: true })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given false for title', () => {
    const cpy = Object.assign({}, min, { title: false })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an object for title', () => {
    const cpy = Object.assign({}, min, { title: {} })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an array for title', () => {
    const cpy = Object.assign({}, min, { title: [] })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns true if given a string for path', () => {
    const cpy = Object.assign({}, min, { path: '/title' })
    expect(isContentData(cpy)).to.equal(true)
  })

  it('returns false if given a number for path', () => {
    const cpy = Object.assign({}, min, { path: 1 })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given true for path', () => {
    const cpy = Object.assign({}, min, { path: true })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given false for path', () => {
    const cpy = Object.assign({}, min, { path: false })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an object for path', () => {
    const cpy = Object.assign({}, min, { path: {} })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an array for path', () => {
    const cpy = Object.assign({}, min, { path: [] })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given a number for body', () => {
    const cpy = Object.assign({}, min, { body: 1 })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given true for body', () => {
    const cpy = Object.assign({}, min, { body: true })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given false for body', () => {
    const cpy = Object.assign({}, min, { body: false })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an object for body', () => {
    const cpy = Object.assign({}, min, { body: {} })
    expect(isContentData(cpy)).to.equal(false)
  })

  it('returns false if given an array for body', () => {
    const cpy = Object.assign({}, min, { body: [] })
    expect(isContentData(cpy)).to.equal(false)
  })
})
