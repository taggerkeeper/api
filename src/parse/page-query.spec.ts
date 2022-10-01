import { expect } from 'chai'
import { mockRequest } from 'mock-req-res'
import parsePageQuery from './page-query.js'

describe('parsePageQuery', () => {
  let mockReq = mockRequest()

  beforeEach(() => {
    mockReq = mockRequest()
  })

  it('parses created before', () => {
    const createdBefore = 1659312000000
    mockReq.query = { 'created-before': createdBefore.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created?.before?.getTime()).to.equal(createdBefore)
    expect(query.created?.after).to.equal(undefined)
    expect(query.updated).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses created after', () => {
    const createdAfter = 1659398400000
    mockReq.query = { 'created-after': createdAfter.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created?.before).to.equal(undefined)
    expect(query.created?.after?.getTime()).to.equal(createdAfter)
    expect(query.updated).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses both created dates', () => {
    const createdBefore = 1659312000000
    const createdAfter = 1659398400000

    mockReq.query = {
      'created-before': createdBefore.toString(),
      'created-after': createdAfter.toString()
    }

    const query = parsePageQuery(mockReq)
    expect(query.created?.before?.getTime()).to.equal(createdBefore)
    expect(query.created?.after?.getTime()).to.equal(createdAfter)
    expect(query.updated).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses updated before', () => {
    const updatedBefore = 1659484800000
    mockReq.query = { 'updated-before': updatedBefore.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.updated?.before?.getTime()).to.equal(updatedBefore)
    expect(query.updated?.after).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses updated after', () => {
    const updatedAfter = 1659571200000
    mockReq.query = { 'updated-after': updatedAfter.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.updated?.before).to.equal(undefined)
    expect(query.updated?.after?.getTime()).to.equal(updatedAfter)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses both updated dates', () => {
    const updatedBefore = 1659484800000
    const updatedAfter = 1659571200000

    mockReq.query = {
      'updated-before': updatedBefore.toString(),
      'updated-after': updatedAfter.toString()
    }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.updated?.before?.getTime()).to.equal(updatedBefore)
    expect(query.updated?.after?.getTime()).to.equal(updatedAfter)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses all dates', () => {
    const createdBefore = 1659312000000
    const createdAfter = 1659398400000
    const updatedBefore = 1659484800000
    const updatedAfter = 1659571200000

    mockReq.query = {
      'created-before': createdBefore.toString(),
      'created-after': createdAfter.toString(),
      'updated-before': updatedBefore.toString(),
      'updated-after': updatedAfter.toString()
    }

    const query = parsePageQuery(mockReq)
    expect(query.created?.before?.getTime()).to.equal(createdBefore)
    expect(query.created?.after?.getTime()).to.equal(createdAfter)
    expect(query.updated?.before?.getTime()).to.equal(updatedBefore)
    expect(query.updated?.after?.getTime()).to.equal(updatedAfter)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses minimum revisions', () => {
    const revisionsMin = 2
    mockReq.query = { 'revisions-minimum': revisionsMin.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions?.min).to.equal(revisionsMin)
    expect(query.revisions?.max).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses maximum revisions', () => {
    const revisionsMax = 20
    mockReq.query = { 'revisions-maximum': revisionsMax.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions?.min).to.equal(undefined)
    expect(query.revisions?.max).to.equal(revisionsMax)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses minimum and maximum revisions', () => {
    const revisionsMin = 2
    const revisionsMax = 20

    mockReq.query = {
      'revisions-minimum': revisionsMin.toString(),
      'revisions-maximum': revisionsMax.toString()
    }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions?.min).to.equal(revisionsMin)
    expect(query.revisions?.max).to.equal(revisionsMax)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses text', () => {
    const text = 'text search query'
    mockReq.query = { text }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(text)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request for trashed pages', () => {
    mockReq.query = { trashed: 'true' }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(true)
  })

  it('parses limit', () => {
    const limit = 50
    mockReq.query = { limit: limit.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(limit)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses offset', () => {
    const offset = 100
    mockReq.query = { offset: offset.toString() }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(offset)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in order of created date', () => {
    const sort = 'created'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in reverse order of created date', () => {
    const sort = '-created'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in order of updated date', () => {
    const sort = 'updated'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in reverse order of updated date', () => {
    const sort = '-updated'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in alphabetical order by title', () => {
    const sort = 'alphabetical'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in reverse alphabetical order by title', () => {
    const sort = '-alphabetical'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('parses a request to sort in search relevance order', () => {
    const sort = 'relevance'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(false)
  })

  it('rejects a request to sort in an unknown order', () => {
    const sort = 'logarithmic'
    mockReq.query = { sort }

    const query = parsePageQuery(mockReq)
    expect(query.created).to.equal(undefined)
    expect(query.created).to.equal(undefined)
    expect(query.revisions).to.equal(undefined)
    expect(query.text).to.equal(undefined)
    expect(query.limit).to.equal(undefined)
    expect(query.offset).to.equal(undefined)
    expect(query.sort).to.equal(undefined)
    expect(query.trashed).to.equal(false)
  })

  it('parses everything at once', () => {
    const createdBefore = 1659312000000
    const createdAfter = 1659398400000
    const updatedBefore = 1659484800000
    const updatedAfter = 1659571200000
    const revisionsMin = 2
    const revisionsMax = 20
    const text = 'text search query'
    const limit = 50
    const offset = 100
    const sort = 'relevance'

    mockReq.query = {
      'created-before': createdBefore.toString(),
      'created-after': createdAfter.toString(),
      'updated-before': updatedBefore.toString(),
      'updated-after': updatedAfter.toString(),
      'revisions-minimum': revisionsMin.toString(),
      'revisions-maximum': revisionsMax.toString(),
      text,
      limit: limit.toString(),
      offset: offset.toString(),
      sort,
      trashed: 'true'
    }

    const query = parsePageQuery(mockReq)
    expect(query.created?.before?.getTime()).to.equal(createdBefore)
    expect(query.created?.after?.getTime()).to.equal(createdAfter)
    expect(query.updated?.before?.getTime()).to.equal(updatedBefore)
    expect(query.updated?.after?.getTime()).to.equal(updatedAfter)
    expect(query.revisions?.min).to.equal(revisionsMin)
    expect(query.revisions?.max).to.equal(revisionsMax)
    expect(query.text).to.equal(text)
    expect(query.limit).to.equal(limit)
    expect(query.offset).to.equal(offset)
    expect(query.sort).to.equal(sort)
    expect(query.trashed).to.equal(true)
  })
})
