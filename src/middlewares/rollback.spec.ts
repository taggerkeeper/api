import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Page from '../models/page/page.js'
import Revision from '../models/revision/revision.js'
import rollback from './rollback.js'

describe('rollback', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  const orig = { content: { title: 'Original Revision', body: 'This is the original text.' } }
  let page = new Page({ revisions: [orig] })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
    page = new Page({ revisions: [orig] })
  })

  afterEach(() => sinon.restore())

  it('does nothing if not given a page', () => {
    mockReq.revision = page.getRevision(1) as Revision
    rollback(mockReq, mockRes, mockNext)
    expect(page.revisions).to.have.lengthOf(1)
  })

  it('does nothing if not given a revision', () => {
    mockReq.page = page
    rollback(mockReq, mockRes, mockNext)
    expect(page.revisions).to.have.lengthOf(1)
  })

  it('rolls back to a previous version', () => {
    mockReq.page = page
    mockReq.revision = page.getRevision(1) as Revision
    rollback(mockReq, mockRes, mockNext)
    expect(page.revisions).to.have.lengthOf(2)
  })
})
