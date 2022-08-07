import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import User from '../models/user/user.js'
import saveSubject from './save-subject.js'

describe('createUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let save: sinon.SinonStub
  const name = 'Tester'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.subject = new User({ name })
    save = sinon.stub(User.prototype, 'save')
    saveSubject(mockReq, mockRes, mockNext)
  })

  it('saves the request subject', () => {
    expect(save.callCount).to.equal(1)
  })
})
