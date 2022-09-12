import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import User from '../models/user/user.js'
import requireUser from './require-user.js'

chai.use(sinonChai)

describe('requireUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 401 if there\'s no user', () => {
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(401)
  })

  it('returns a message if there\'s no user', () => {
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication.')
  })

  it('returns 403 if the user has been deactivated', () => {
    mockReq.user = new User({ name: 'Deactivated User', active: false })
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
  })

  it('returns a message if the user has been deactivated', () => {
    mockReq.user = new User({ name: 'Deactivated User', active: false })
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('Your account has been deactivated.')
  })

  it('calls the next middleware if there is a user', () => {
    mockReq.user = new User()
    requireUser(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
