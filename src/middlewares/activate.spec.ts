import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import activate from './activate.js'

describe('activate', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const user = new User({ name: 'Tester', active: false })

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    activate(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })

  it('activates the subject', () => {
    mockReq.subject = user
    activate(mockReq, mockRes, mockNext)
    expect(mockReq.subject.active).to.equal(true)
  })
})
