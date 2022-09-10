import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import deactivate from './deactivate.js'

describe('demote', () => {
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
    deactivate(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })

  it('removes the admin flag from the subject', () => {
    mockReq.subject = user
    deactivate(mockReq, mockRes, mockNext)
    expect(mockReq.subject.active).to.equal(false)
  })
})
