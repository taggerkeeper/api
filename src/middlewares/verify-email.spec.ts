import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import Email from '../models/email/email.js'
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
    mockReq.subject = new User({ name, emails: [{ addr }] })
    mockReq.subject.emails[0].generateVerificationCode()
  })

  it('doesn\'t add an email to the request if the code doesn\'t match anything', () => {
    mockReq.params = { code: mockReq.subject?.emails[0].code === 'abc123' ? 'xyz098' : 'abc123' }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.equal(undefined)
  })

  it('adds an email to the request if the code is correct', () => {
    mockReq.params = { code: mockReq.subject?.emails[0].code as string }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.be.an.instanceOf(Email)
  })

  it('verifies the email if the code is correct', () => {
    mockReq.params = { code: mockReq.subject?.emails[0].code as string }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email?.verified).to.equal(true)
  })

  it('verifies the email in the subject user record if the code is correct', () => {
    mockReq.params = { code: mockReq.subject?.emails[0].code as string }
    verifyEmail(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.emails[0].verified).to.equal(true)
  })
})
