import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import promote from './promote.js'

describe('promote', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const user = new User()

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    promote(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })

  it('promotes the subject to admin', () => {
    mockReq.subject = user
    promote(mockReq, mockRes, mockNext)
    expect(mockReq.subject.admin).to.equal(true)
  })
})
