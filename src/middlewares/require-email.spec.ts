import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Email from '../models/email/email.js'
import requireEmail from './require-email.js'

chai.use(sinonChai)

describe('requireEmail', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  const addr = 'test@taggerkeeper.com'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 400 if there\'s no email and no address is provided', () => {
    requireEmail(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(400)
  })

  it('returns a message if there\'s no email and no address is provided', () => {
    requireEmail(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('No email address provided.')
  })

  it('returns 404 if there\'s no email but an address is provided', () => {
    mockReq.params = { addr }
    requireEmail(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(404)
  })

  it('returns a message if there\'s no email but an address is provided', () => {
    mockReq.params = { addr }
    requireEmail(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal(`No email found with the given address (${addr}).`)
  })

  it('calls the next middleware if there is an email', () => {
    mockReq.email = new Email({ addr })
    requireEmail(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
