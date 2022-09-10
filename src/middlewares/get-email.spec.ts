import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import getEmail from './get-email.js'

describe('getEmail', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const addr = 'tester@testing.com'
  const verified = true
  const user = new User({ id: uid, name, emails: [{ addr, verified }] })

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    mockReq.params = { addr }
    getEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.equal(undefined)
  })

  it('does nothing if there is no email parameter', () => {
    mockReq.subject = user
    getEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.equal(undefined)
  })

  it('adds the email to the request', () => {
    mockReq.subject = user
    mockReq.params = { addr }
    getEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email?.addr).to.equal(addr)
    expect(mockReq.email?.verified).to.equal(verified)
  })
})
