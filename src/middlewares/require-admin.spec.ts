import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import User from '../models/user/user.js'
import requireAdmin from './require-admin.js'

chai.use(sinonChai)

describe('requireAdmin', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 403 if there\'s no user', () => {
    requireAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
  })

  it('returns a message if there\'s no user', () => {
    requireAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by an administrator.')
  })

  it('returns 403 if there\'s a non-admin user', () => {
    mockReq.user = new User()
    requireAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
  })

  it('returns a message if there\'s a non-admin user', () => {
    mockReq.user = new User()
    requireAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by an administrator.')
  })

  it('calls the next middleware if there is an admin', () => {
    mockReq.user = new User({ name: 'Admin', admin: true })
    requireAdmin(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
