import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import Email from '../models/email/email.js'
import sendEmailVerification from './send-email-verification.js'

describe('sendEmailVerification', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.email = new Email({ addr: 'test@testing.com' })
    mockReq.emailer = sinon.stub()
    sendEmailVerification(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('sends the verification email', () => {
    expect((mockReq.emailer as sinon.SinonStub)?.firstCall.args[1]).to.equal('Can you verify this email address?')
  })
})
