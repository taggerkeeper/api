import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import User from '../models/user/user.js'
import requireSubject from './require-subject.js'

chai.use(sinonChai)

describe('requireSubject', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  const uid = '0123456789abcdef12345678'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  it('returns 400 if there\'s no subject and no uid is provided', () => {
    requireSubject(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(400)
  })

  it('returns a message if there\'s no subject and no uid is provided', () => {
    requireSubject(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('No user ID (uid) provided.')
  })

  it('returns 404 if there\'s no subject but a uid is provided', () => {
    mockReq.params = { uid }
    requireSubject(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(404)
  })

  it('returns a message if there\'s no subject but a uid is provided', () => {
    mockReq.params = { uid }
    requireSubject(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal(`No user found with the ID ${uid}.`)
  })

  it('calls the next middleware if there is a subject', () => {
    mockReq.subject = new User({ id: uid, name: 'Tester' })
    requireSubject(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
