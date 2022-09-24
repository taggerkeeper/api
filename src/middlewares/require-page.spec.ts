import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import Page from '../models/page/page.js'
import requirePage from './require-page.js'

describe('requirePage', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 404 if there\'s no page', () => {
    requirePage(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(404)
  })

  it('returns a message if there\'s no page', () => {
    requirePage(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('Page not found.')
  })

  it('calls the next middleware if there is a page', () => {
    mockReq.page = new Page()
    requirePage(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
