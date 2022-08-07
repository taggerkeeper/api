import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import setPassword from './set-password.js'

describe('setPassword', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const password = 'Longer passwords are better passwords.'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.subject = new User({ name })
    mockReq.body = { password }
    setPassword(mockReq, mockRes, mockNext)
  })

  it('changes the request subject\'s password', () => {
    expect(mockReq.subject?.password.verify(password)).to.equal(true)
  })
})
