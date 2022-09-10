import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import dropEmail from './drop-email.js'

describe('dropEmail', () => {
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
    dropEmail(mockReq, mockRes, mockNext)
    expect(mockReq.subject).to.equal(undefined)
  })

  it('does nothing if there is no addr parameter', () => {
    mockReq.subject = user
    dropEmail(mockReq, mockRes, mockNext)
    expect(mockReq.subject.emails).to.have.lengthOf(1)
  })

  it('drops the email in the subject record', () => {
    mockReq.subject = user
    mockReq.params = { addr }
    dropEmail(mockReq, mockRes, mockNext)
    expect(mockReq.subject.emails).to.have.lengthOf(0)
  })
})
