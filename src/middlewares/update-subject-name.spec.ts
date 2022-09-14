import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import updateSubjectName from './update-subject-name.js'

describe('updateSubjectName', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const user = new User()
  const name = 'New Name'

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
  })

  it('does nothing if there is no subject', () => {
    mockReq.body = { name }
    updateSubjectName(mockReq, mockRes, mockNext)
    expect(mockReq.subject).to.equal(undefined)
  })

  it('does nothing if there is no name', () => {
    mockReq.subject = user
    updateSubjectName(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.name).not.to.equal(name)
  })

  it('changes the subject\'s name', () => {
    mockReq.subject = user
    mockReq.body = { name }
    updateSubjectName(mockReq, mockRes, mockNext)
    expect(mockReq.subject?.name).to.equal(name)
  })
})
