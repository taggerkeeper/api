import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import UserModel from '../models/user/model.js'
import loadSubject from './load-subject.js'

describe('loadSubject', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let load: sinon.SinonStub
  const uid = '0123456789abcdef12345678'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    load = sinon.stub(UserModel, 'findById')
  })

  afterEach(() => sinon.restore())

  it('does nothing if no user ID is provided', () => {
    loadSubject(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(0)
  })

  it('loads the subject identified by the user ID provided', () => {
    mockReq.params = { uid }
    loadSubject(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(1)
    expect(load.calledWith(uid)).to.equal(true)
  })
})
