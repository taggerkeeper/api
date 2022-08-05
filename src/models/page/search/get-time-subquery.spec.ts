import { expect } from 'chai'
import getTimeSubquery from './get-time-subquery.js'

describe('getTimeSubquery', () => {
  const before = new Date('1 August 2022')
  const after = new Date('31 July 2022')

  it('returns false if the query doesn\'t include that timestamp', () => {
    expect(getTimeSubquery({}, 'created')).to.equal(false)
  })

  it('creates a subquery for created before a date', () => {
    const query = { created: { before } }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$gte":"${before.toJSON()}"}}`)
  })

  it('creates a subquery for created after a date', () => {
    const query = { created: { after } }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$lte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for created before one date and after another date', () => {
    const query = { created: { before, after } }
    const actual = getTimeSubquery(query, 'created')
    expect(JSON.stringify(actual)).to.equal(`{"created":{"$gte":"${before.toJSON()}","$lte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for updated before a date', () => {
    const query = { updated: { before } }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$gte":"${before.toJSON()}"}}`)
  })

  it('creates a subquery for updated after a date', () => {
    const query = { updated: { after } }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$lte":"${after.toJSON()}"}}`)
  })

  it('creates a subquery for updated before one date and after another date', () => {
    const query = { updated: { before, after } }
    const actual = getTimeSubquery(query, 'updated')
    expect(JSON.stringify(actual)).to.equal(`{"updated":{"$gte":"${before.toJSON()}","$lte":"${after.toJSON()}"}}`)
  })
})
