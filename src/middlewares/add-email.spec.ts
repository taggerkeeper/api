import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import Email from '../models/email/email.js'
import addEmail from './add-email.js'

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
    mockReq.subject = new User({ name })
    mockReq.body = { email: addr }
    addEmail(mockReq, mockRes, mockNext)
  })

  it('adds to the request subject\'s array of emails', () => {
    expect(mockReq.subject?.emails).to.have.lengthOf(1)
  })

  it('adds an Email instance to the request', () => {
    expect(mockReq.email).to.be.an.instanceOf(Email)
  })

  it('sets the address for the email', () => {
    expect(mockReq.email?.addr).to.equal(addr)
  })

  it('creates an unverified email on the request', () => {
    expect(mockReq.email?.verified).to.equal(false)
  })

  it('adds an Email instance to the request subject\'s array of emails', () => {
    expect(mockReq.subject?.emails[0]).to.be.an.instanceOf(Email)
  })

  it('sets the address for the request subject\'s new email', () => {
    expect(mockReq.subject?.emails[0].addr).to.equal(addr)
  })

  it('creates an unverified email', () => {
    expect(mockReq.subject?.emails[0].verified).to.equal(false)
  })
})
