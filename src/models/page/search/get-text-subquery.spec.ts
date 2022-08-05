import { expect } from 'chai'
import getTextSubquery from './get-text-subquery.js'

describe('getTextSubquery', () => {
  it('returns false if not given a query', () => {
    expect(getTextSubquery()).to.equal(false)
  })

  it('returns false if given undefined as a query', () => {
    expect(getTextSubquery(undefined)).to.equal(false)
  })

  it('returns a text search subquery', () => {
    const json = JSON.stringify(getTextSubquery({ text: 'test' }))
    expect(json).to.equal('{"$text":{"$search":"test","$caseSensitive":false,"$diacriticSensitive":false}}')
  })
})
