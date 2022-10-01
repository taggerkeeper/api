import { expect } from 'chai'
import getTimeSubquery from './get-time-subquery.js'

describe('getTimeSubquery', () => {
  const before = new Date('1 August 2022')
  const after = new Date('31 July 2022')

  it('returns false if the query doesn\'t include that timestamp', () => {
    expect(getTimeSubquery({ trashed: false }, 'created')).to.equal(false)
  })

  it('creates a subquery for created before a date', () => {
    const query = { created: { before }, trashed: false }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$lte":"${before.toJSON()}"}}`)
  })

  it('creates a subquery for created after a date', () => {
    const query = { created: { after }, trashed: false }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$gte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for created before one date and after another date', () => {
    const query = { created: { before, after }, trashed: false }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$lte":"${before.toJSON()}","$gte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for updated before a date', () => {
    const query = { updated: { before }, trashed: false }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$lte":"${before.toJSON()}"}}`)
  })

  it('creates a subquery for updated after a date', () => {
    const query = { updated: { after }, trashed: false }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$gte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for updated before one date and after another date', () => {
    const query = { updated: { before, after }, trashed: false }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$lte":"${before.toJSON()}","$gte":"${after.toJSON()}"}}`)
  })
})
