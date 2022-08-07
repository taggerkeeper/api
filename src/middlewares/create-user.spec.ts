import { expect } from 'chai'
import * as sinon from 'sinon'
import { mockRequest, mockResponse } from 'mock-req-res'
import User from '../models/user/user.js'
import createUser from './create-user.js'

describe('createUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let save: sinon.SinonStub
  const name = 'Tester'

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    save = sinon.stub(User.prototype, 'save')
    mockReq.body = { name }
    await createUser(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('sets a User instance for the request subject', async () => {
    expect(mockReq.subject).to.be.an.instanceOf(User)
  })

  it('sets the name for the request subject', async () => {
    expect(mockReq.subject?.name).to.equal(name)
  })

  it('saves the request subject', async () => {
    expect(save.callCount).to.equal(1)
  })
})
