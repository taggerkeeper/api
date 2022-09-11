import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import User from '../models/user/user.js'
import requireSelfOrAdmin from './require-self-or-admin.js'

chai.use(sinonChai)

describe('requireSelfOrAdmin', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  const data = { id: '0123456789abcdef01234567', name: 'Tester' }
  const user = new User(data)
  const subject = new User(data)
  const other = new User({ id: '9876543210fedcba98765432', name: 'Other' })
  const admin = new User({ id: 'abcdef012345678987654321', name: 'Admin', admin: true })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns an error if there\'s no user or subject', () => {
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by the subject or an administrator.')
  })

  it('returns an error if there\'s no user', () => {
    mockReq.subject = subject
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by the subject or an administrator.')
  })

  it('returns an error if there\'s no subject', () => {
    mockReq.user = user
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by the subject or an administrator.')
  })

  it('returns an error if the subject is different from the user, but the user isn\'t an admin', () => {
    mockReq.user = other
    mockReq.subject = subject
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(403)
    expect(mockRes.send.firstCall.args[0].message).to.equal('This method requires authentication by the subject or an administrator.')
  })

  it('calls the next middleware if the subject is the user', () => {
    mockReq.user = user
    mockReq.subject = subject
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })

  it('calls the next middleware if the user is an admin', () => {
    mockReq.user = admin
    mockReq.subject = subject
    requireSelfOrAdmin(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
