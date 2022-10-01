import { expect } from 'chai'
import buildQuery from './build-query.js'

describe('buildQuery', () => {
  const before = new Date('1 August 2022')
  const after = new Date('31 July 2022')

  it('does not include revisions if the query doesn\'t ask for them', () => {
    const actual = buildQuery({ trashed: false })
    expect(actual.revisions).to.equal(undefined)
  })

  it('includes minimum revisions clause if it\'s part of the query', () => {
    const actual = buildQuery({ revisions: { min: 1 }, trashed: false })
    expect(actual['revisions.0'].$exists).to.equal(true)
  })

  it('includes maximum revisions clause if it\'s part of the query', () => {
    const actual = buildQuery({ revisions: { max: 3 }, trashed: false })
    expect(actual['revisions.3'].$exists).to.equal(false)
  })

  it('includes page security checks', () => {
    const actual = buildQuery({ trashed: false })
    expect(actual['revisions.0.permissions.read']).to.equal('anyone')
  })

  it('includes full text search if it\'s part of the query', () => {
    const text = 'test'
    const actual = buildQuery({ text, trashed: false })
    expect(actual.$text.$search).to.equal(text)
  })

  it('includes created before criteria if it\'s part of the query', () => {
    const actual = buildQuery({ created: { before }, trashed: false })
    expect(actual.created.$lte).to.equal(before)
  })

  it('includes created after criteria if it\'s part of the query', () => {
    const actual = buildQuery({ created: { after }, trashed: false })
    expect(actual.created.$gte).to.equal(after)
  })

  it('includes updated before criteria if it\'s part of the query', () => {
    const actual = buildQuery({ updated: { before }, trashed: false })
    expect(actual.updated.$lte).to.equal(before)
  })

  it('includes updated after criteria if it\'s part of the query', () => {
    const actual = buildQuery({ updated: { after }, trashed: false })
    expect(actual.updated.$gte).to.equal(after)
  })
})
