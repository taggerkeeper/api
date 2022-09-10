import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import verifyEmail from './verify-email.js'

describe('addEmail', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const addr = 'tester@taggerkeeper.com'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.subject = new User({ name, emails: [{ addr, verified: false }] })
    mockReq.email = mockReq.subject.emails[0]
    mockReq.email.generateVerificationCode()
  })

  it('doesn\'t verify the email if the code is incorrect', () => {
    mockReq.body = { code: mockReq.subject?.emails[0].code === 'abc123' ? 'xyz098' : 'abc123' }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email?.verified).to.equal(false)
  })

  it('verifies the email if the code is correct', () => {
    mockReq.body = { code: mockReq.subject?.emails[0].code as string }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email?.verified).to.equal(true)
  })

  it('verifies the email in the subject user record if the code is correct', () => {
    mockReq.body = { code: mockReq.subject?.emails[0].code as string }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.emails[0].verified).to.equal(true)
  })
})
