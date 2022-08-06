import { expect } from 'chai'
import { spy } from 'sinon'
import { mockRequest, mockResponse } from 'mock-req-res'
import allow from './allow.js'

describe('allow', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = spy()

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = spy()
  })

  it('calls next if an allowed method is called', () => {
    mockReq.method = 'GET'
    allow({ get: () => {} })(mockReq, mockRes, mockNext)
    expect(mockNext.called).to.equal(true)
  })

  it('sets the Allow header if an allowed method is called', () => {
    mockReq.method = 'GET'
    allow({ get: () => {}, head: () => {} })(mockReq, mockRes, mockNext)
    expect(mockRes.set.args[0].join(' ')).to.equal('Allow GET, HEAD')
  })

  it('sets the Access-Control-Allow-Methods header if an allowed method is called', () => {
    mockReq.method = 'GET'
    allow({ get: () => {}, head: () => {} })(mockReq, mockRes, mockNext)
    expect(mockRes.set.args[1].join(' ')).to.equal('Access-Control-Allow-Methods GET, HEAD')
  })

  it('sends a 405 if an unallowed method is called', () => {
    mockReq.method = 'POST'
    allow({ get: () => {}, head: () => {} })(mockReq, mockRes, mockNext)
    expect(mockRes.status.calledWith(405)).to.equal(true)
  })

  it('sends an error if an unallowed method is called', () => {
    mockReq.method = 'POST'
    mockReq.originalUrl = '/test/path?param=test'
    allow({ get: () => {}, head: () => {} })(mockReq, mockRes, mockNext)
    expect(JSON.stringify(mockRes.send.args[0][0])).to.equal('{"status":405,"message":"POST is not a method allowed for /test/path"}')
  })

  it('sets the Allow header if an unallowed method is called', () => {
    mockReq.method = 'POST'
    allow({ get: () => {}, head: () => {} })(mockReq, mockRes, mockNext)
    expect(mockRes.set.args[0].join(' ')).to.equal('Allow GET, HEAD')
  })
})
