import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import jwt from 'jsonwebtoken'
import User from '../models/user/user.js'
import loadPackage from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import getFirstVal from '../utils/get-first-val.js'
import getEnvVar from '../utils/get-env-var.js'
import issueTokens from './issue-tokens.js'

chai.use(sinonChai)

describe('issueTokens', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const secret = getFirstVal(getEnvVar('JWT_SECRET'), 'load a secret as an environment variable named JWT_SECRET')

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.user = new User({ name, id: uid })
    await issueTokens(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('issues a cookie', () => {
    expect(mockRes.cookie).to.have.callCount(1)
  })

  it('issues a refresh cookie', () => {
    expect(mockRes.cookie.firstCall.args[0]).to.equal('refresh')
  })

  it('issues the user\'s refresh code in a JWT in the refresh cookie', () => {
    const obj = jwt.verify(mockRes.cookie.firstCall.args[1], secret) as any
    expect(obj.uid).to.equal(uid)
  })

  it('issues the user\'s ID in a JWT in the refresh cookie', () => {
    const obj = jwt.verify(mockRes.cookie.firstCall.args[1], secret) as any
    expect(obj.refresh).to.equal(mockReq.user?.refresh)
  })

  it('sets the issuer for the JWT in the refresh cookie', async () => {
    const pkg = await loadPackage()
    const { host } = getAPIInfo(pkg)
    const obj = jwt.verify(mockRes.cookie.firstCall.args[1], secret) as any
    expect(obj.iss).to.equal(host)
  })

  it('sets the subject for the JWT in the refresh cookie', async () => {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    const subject = `${root}/users/${uid}`
    const obj = jwt.verify(mockRes.cookie.firstCall.args[1], secret) as any
    expect(obj.sub).to.equal(subject)
  })

  it('sets the expiration for the JWT in the refresh cookie', async () => {
    const now = new Date()
    const refreshExpires = getFirstVal(getEnvVar('REFRESH_EXPIRES'), 86400000) as number
    const limit = (now.getTime() / 1000) + refreshExpires + 5
    const obj = jwt.verify(mockRes.cookie.firstCall.args[1], secret) as any
    expect(obj.exp).to.be.at.most(limit)
  })

  it('sets the domain on the refresh cookie', async () => {
    const pkg = await loadPackage()
    const { host } = getAPIInfo(pkg)
    expect(mockRes.cookie.firstCall.args[2].domain).to.equal(host)
  })

  it('issues the refresh cookie as HTTP only', async () => {
    expect(mockRes.cookie.firstCall.args[2].httpOnly).to.equal(true)
  })

  it('sets a maximum age for the refresh cookie', async () => {
    const now = new Date()
    const refreshExpires = getFirstVal(getEnvVar('REFRESH_EXPIRES'), 86400000) as number
    const limit = (now.getTime() / 1000) + refreshExpires + 5
    expect(mockRes.cookie.firstCall.args[2].maxAge).to.be.at.most(limit)
  })

  it('returns 200', async () => {
    expect(mockRes.status).to.have.been.calledWith(200)
  })

  it('issues the user\'s public information as a JWT', () => {
    const obj = jwt.verify(mockRes.send.firstCall.args[0].token, secret) as any
    const actual = [obj.id, obj.name].join(' ')
    const expected = [uid, name].join(' ')
    expect(actual).to.equal(expected)
  })

  it('sets the issuer for the JWT', async () => {
    const pkg = await loadPackage()
    const { host } = getAPIInfo(pkg)
    const obj = jwt.verify(mockRes.send.firstCall.args[0].token, secret) as any
    expect(obj.iss).to.equal(host)
  })

  it('sets the subject for the JWT in the refresh cookie', async () => {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    const subject = `${root}/users/${uid}`
    const obj = jwt.verify(mockRes.send.firstCall.args[0].token, secret) as any
    expect(obj.sub).to.equal(subject)
  })

  it('sets the expiration for the JWT in the refresh cookie', async () => {
    const now = new Date()
    const tokenExpires = getFirstVal(getEnvVar('JWT_EXPIRES'), 300) as number
    const limit = (now.getTime() / 1000) + tokenExpires + 5
    const obj = jwt.verify(mockRes.send.firstCall.args[0].token, secret) as any
    expect(obj.exp).to.be.at.most(limit)
  })
})
