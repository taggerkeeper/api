import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Revision from '../models/revision/revision.js'
import requireRevision from './require-revision.js'

describe('requireRevision', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 404 if there\'s no revision', () => {
    requireRevision(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(404)
  })

  it('returns a message if there\'s no revision', () => {
    requireRevision(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('Revision not found.')
  })

  it('calls the next middleware if there is a revision', () => {
    mockReq.revision = new Revision({ content: { title: 'Hello, world!', body: 'This is the body.' } })
    requireRevision(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
