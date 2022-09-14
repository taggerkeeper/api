import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import updateSubjectPassword from './update-subject-password.js'

describe('updateSubjectPassword', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const user = new User()
  const password = 'Longer passwords are still better passwords, even when you change them.'

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    mockReq.body = { password }
    updateSubjectPassword(mockReq, mockRes, mockNext)
    expect(mockReq.subject).to.equal(undefined)
  })

  it('does nothing if there is no password', () => {
    mockReq.subject = user
    updateSubjectPassword(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.password.verify(password)).to.equal(false)
  })

  it('changes the subject\'s password', () => {
    mockReq.subject = user
    mockReq.body = { password }
    updateSubjectPassword(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.password.verify(password)).to.equal(true)
  })
})
