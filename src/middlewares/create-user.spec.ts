import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import createUser from './create-user.js'

describe('createUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.body = { name }
    createUser(mockReq, mockRes, mockNext)
  })

  it('sets a User instance for the request subject', () => {
    expect(mockReq.subject).to.be.an.instanceOf(User)
  })

  it('sets the name for the request subject', () => {
    expect(mockReq.subject?.name).to.equal(name)
  })
})
