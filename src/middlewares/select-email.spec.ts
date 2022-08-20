import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import Email from '../models/email/email.js'
import selectEmail from './select-email.js'

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
  })

  it('doesn\'t add an email to the request if the address doesn\'t match ant of the user\'s emails', () => {
    mockReq.params = { addr: 'nope@test.com' }
    selectEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.equal(undefined)
  })

  it('adds an email to the request if the address is correct', () => {
    mockReq.params = { addr }
    selectEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email).to.be.an.instanceOf(Email)
  })

  it('selects the correct emails', () => {
    mockReq.params = { addr }
    selectEmail(mockReq, mockRes, mockNext)
    expect(mockReq.email?.addr).to.equal(addr)
  })
})
