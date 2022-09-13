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
  let mockNext = sinon.spy()
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
    mockNext = sinon.spy()
    load = sinon.stub(UserModel, 'find').resolves([Object.assign({}, user.getObj(), { _id: uid })])
  })

  afterEach(() => sinon.restore())

  describe('no email is provided', () => {
    beforeEach(async () => {
      await loadUserFromLogin(mockReq, mockRes, mockNext)
    })

    it('doesn\'t load any users', () => {
      expect(load.callCount).to.equal(0)
    })

    it('returns 400', () => {
      expect(mockRes.status.firstCall.args[0]).to.equal(400)
    })

    it('returns an error', () => {
      expect(mockRes.send.firstCall.args[0].message).to.equal('Authentication failed.')
    })
  })

  describe('email is provided, but password is wrong', () => {
    beforeEach(async () => {
      mockReq.body = { addr }
      await loadUserFromLogin(mockReq, mockRes, mockNext)
    })

    it('tries to load a user', () => {
      expect(load.callCount).to.equal(1)
    })

    it('returns 400', () => {
      expect(mockRes.status.firstCall.args[0]).to.equal(400)
    })

    it('returns an error', () => {
      expect(mockRes.send.firstCall.args[0].message).to.equal('Authentication failed.')
    })
  })

  describe('correct email and password are provided (no OTP)', () => {
    beforeEach(async () => {
      mockReq.body = { addr, password }
      await loadUserFromLogin(mockReq, mockRes, mockNext)
    })

    it('adds the user to the request', () => {
      expect(mockReq.user?.id).to.equal(uid)
    })

    it('calls the next middleware', () => {
      expect(mockNext.callCount).to.equal(1)
    })
  })

  describe('correct email, password, and OTP passcode are provided', () => {
    beforeEach(async () => {
      const secret = 'shhhhh'
      const passcode = speakeasy.totp({ secret, encoding: 'base32' })
      user.otp.enable(secret)
      load.resolves([Object.assign({}, user.getObj(), { _id: uid })])
      mockReq.body = { addr, password, passcode }
      await loadUserFromLogin(mockReq, mockRes, mockNext)
    })

    it('adds the user to the request', () => {
      expect(mockReq.user?.id).to.equal(uid)
    })

    it('calls the next middleware', () => {
      expect(mockNext.callCount).to.equal(1)
    })
  })

  describe('correct email and password, but incorrect passcode', () => {
    beforeEach(async () => {
      const secret = 'shhhhh'
      user.otp.enable(secret)
      load.resolves([Object.assign({}, user.getObj(), { _id: uid })])
      mockReq.body = { addr, password, passcode: 'nope' }
      await loadUserFromLogin(mockReq, mockRes, mockNext)
    })

    it('tries to load a user', () => {
      expect(load.callCount).to.equal(1)
    })

    it('returns 400', () => {
      expect(mockRes.status.firstCall.args[0]).to.equal(400)
    })

    it('returns an error', () => {
      expect(mockRes.send.firstCall.args[0].message).to.equal('Authentication failed.')
    })
  })
})
