import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import UserModel from '../models/user/model.js'
import requireRefreshToken from './require-refresh-token.js'

chai.use(sinonChai)

describe('requireRefreshToken', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()
  const uid = '0123456789abcdef12345678'
  const refresh = 'my-refresh-token'

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  afterEach(() => sinon.restore())

  it('returns 401 if no user is found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)
    await requireRefreshToken(mockReq, mockRes, mockNext)
    expect(mockRes.status.firstCall.args[0]).to.equal(401)
  })

  it('returns a WWW-Authenticate header if no user is found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)
    await requireRefreshToken(mockReq, mockRes, mockNext)
    expect(mockRes.set.firstCall.args[0]).to.equal('WWW-Authenticate')
    expect(mockRes.set.firstCall.args[1]).to.equal('Bearer error="invalid_token" error_description="The access token could not be verified."')
  })

  it('provides an error message if no user is found', async () => {
    sinon.stub(UserModel, 'findOne').resolves(null)
    await requireRefreshToken(mockReq, mockRes, mockNext)
    expect(mockRes.send.firstCall.args[0].message).to.equal('Could not verify refresh token.')
  })

  it('calls the next function if everything checks out', async () => {
    sinon.stub(UserModel, 'findOne').resolves({ id: uid, name: 'Tester', refresh })
    mockReq.params = { uid }
    mockReq.body = { refresh }
    await requireRefreshToken(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })

  it('sets the user on the Request if everything checks out', async () => {
    sinon.stub(UserModel, 'findOne').resolves({ id: uid, name: 'Tester', refresh })
    mockReq.params = { uid }
    mockReq.body = { refresh }
    await requireRefreshToken(mockReq, mockRes, mockNext)
    expect(mockReq.user).not.to.equal(undefined)
  })
})
