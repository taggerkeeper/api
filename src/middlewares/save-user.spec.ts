import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import User from '../models/user/user.js'
import saveUser from './save-user.js'

describe('saveUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let save: sinon.SinonStub
  const name = 'Tester'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.user = new User({ name })
    save = sinon.stub(User.prototype, 'save')
    saveUser(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('saves the request subject', () => {
    expect(save.callCount).to.equal(1)
  })
})
