import { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import speakeasy from 'speakeasy'
import User from '../models/user/user.js'
import UserModel from '../models/user/model.js'
import loadUserFromLogin from './load-user-from-login.js'

describe('loadUserFromLogin', () => {
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
    load = sinon.stub(UserModel, 'find').resolves([Object.assign({}, user.getObj(), { _id: uid })])
  })

  afterEach(() => sinon.restore())

  it('does nothing if no email is provided', async () => {
    await loadUserFromLogin(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(0)
  })

  it('loads the user if an email address is provided', async () => {
    mockReq.body = { addr }
    await loadUserFromLogin(mockReq, mockRes, mockNext)
    expect(load.callCount).to.equal(1)
  })

  it('adds the user to the request if the password is correct', async () => {
    mockReq.body = { addr, password }
    await loadUserFromLogin(mockReq, mockRes, mockNext)
    expect(mockReq.user?.id).to.equal(uid)
  })

  it('also checks OTP if that\'s enabled', async () => {
    const secret = 'shhhhh'
    const passcode = speakeasy.totp({ secret, encoding: 'base32' })
    user.otp.enable(secret)
    load.resolves([Object.assign({}, user.getObj(), { _id: uid })])
    mockReq.body = { addr, password, passcode }
    await loadUserFromLogin(mockReq, mockRes, mockNext)
    expect(mockReq.user?.id).to.equal(uid)
  })

  it('does nothing if OTP is enabled but the passcode is wrong', async () => {
    const secret = 'shhhhh'
    user.otp.enable(secret)
    load.resolves([Object.assign({}, user.getObj(), { _id: uid })])
    mockReq.body = { addr, password, passcode: 'nope' }
    await loadUserFromLogin(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })
})
