import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import demote from './demote.js'

describe('demote', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const user = new User({ name: 'Tester', admin: true })

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    demote(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })

  it('removes the admin flag from the subject', () => {
    mockReq.subject = user
    demote(mockReq, mockRes, mockNext)
    expect(mockReq.subject.admin).to.equal(false)
  })
})
