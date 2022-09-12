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

  it('returns 400 if there\'s no user', () => {
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(400)
  })

  it('returns a message if there\'s no user', () => {
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication.')
  })

  it('returns 401 if the not given a valid access token', () => {
    mockReq.headers = { authorization: 'Bearer lolnope' }
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(401)
  })

  it('returns a message if not given a valid access token', () => {
    mockReq.headers = { authorization: 'Bearer lolnope' }
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication.')
  })

  it('sets a WWW-Authenticate header if not given a valid access token', () => {
    mockReq.headers = { authorization: 'Bearer lolnope' }
    requireUser(mockReq, mockRes, mockNext)
    expect(mockRes.set.firstCall.args[0]).to.equal('WWW-Authenticate')
    expect(mockRes.set.firstCall.args[1]).to.equal('Bearer error="invalid_token" error_description="The access token could not be verified."')
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
