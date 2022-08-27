import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import User from '../models/user/user.js'
import UserModel from '../models/user/model.js'
import loadPackage, { NPMPackage } from '../utils/load-package.js'
import getEnvVar from '../utils/get-env-var.js'
import signJWT from '../utils/sign-jwt.js'
import loadUserFromAccessToken from './load-user-from-access-token.js'

describe('loadUserFromAccessToken', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  let load: sinon.SinonStub
  const addr = 'tester@testing.com'
  const uid = '0123456789abcdef12345678'
  const name = 'Tester'
  const password = 'password'
  const user = new User({ _id: uid, name, emails: [{ addr, verified: true }] })
  user.password.change(password)

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    load = sinon.stub(UserModel, 'findById').resolves(Object.assign({}, user.getObj(), { _id: uid }))
  })

  afterEach(() => sinon.restore())

  it('does nothing if no token is provided', async () => {
    await loadUserFromAccessToken(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(0)
    expect(mockReq.user).to.equal(undefined)
  })

  it('does nothing if the JWT cannot be verified', async () => {
    const pkg = await loadPackage() as NPMPackage
    const jwt = signJWT({ message: 'lolnope' }, 'not the secret you were looking for', 10000, pkg)
    mockReq.headers = { authorization: `Bearer ${jwt}` }
    await loadUserFromAccessToken(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(0)
    expect(mockReq.user).to.equal(undefined)
  })

  it('loads the user to the request if the JWT can be verified', async () => {
    const pkg = await loadPackage() as NPMPackage
    const jwt = signJWT(user.getPublicObj(), getEnvVar('JWT_SECRET') as string, 10000, pkg)
    mockReq.headers = { authorization: `Bearer ${jwt}` }
    await loadUserFromAccessToken(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(1)
    expect(mockReq.user).to.be.an.instanceOf(User)
    expect(mockReq.user?.id).to.equal(uid)
    expect(mockReq.user?.name).to.equal(name)
  })
})
