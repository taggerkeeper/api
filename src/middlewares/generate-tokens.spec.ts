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
import generateTokens from './generate-tokens.js'

chai.use(sinonChai)

describe('generateTokens', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const secret = getEnvVar('JWT_SECRET') as string

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    mockReq.user = new User({ name, id: uid })
    await generateTokens(mockReq, mockRes, mockNext)
  })

  afterEach(() => sinon.restore())

  it('generates a refresh JWT that includes the user\'s ID', () => {
    const obj = jwt.verify(mockReq.tokens.refresh, secret) as any
    expect(obj.uid).to.equal(uid)
  })

  it('generates a refresh JWT that includes the user\'s refresh code', () => {
    const obj = jwt.verify(mockReq.tokens.refresh, secret) as any
    expect(obj.refresh).to.equal(mockReq.user?.refresh)
  })

  it('generates a refresh JWT that includes the issuer', async () => {
    const pkg = await loadPackage()
    const { host } = getAPIInfo(pkg)
    const obj = jwt.verify(mockReq.tokens.refresh, secret) as any
    expect(obj.iss).to.equal(host)
  })

  it('generates a refresh JWT that includes the subject', async () => {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    const subject = `${root}/users/${uid}`
    const obj = jwt.verify(mockReq.tokens.refresh, secret) as any
    expect(obj.sub).to.equal(subject)
  })

  it('generates a refresh JWT the includes the expiration', async () => {
    const now = new Date()
    const refreshExpires = getFirstVal(getEnvVar('REFRESH_EXPIRES'), 86400000) as number
    const limit = (now.getTime() / 1000) + refreshExpires + 5
    const obj = jwt.verify(mockReq.tokens.refresh, secret) as any
    expect(obj.exp).to.be.at.most(limit)
  })

  it('generates an access JWT that includes the user\'s public information', () => {
    const obj = jwt.verify(mockReq.tokens.access, secret) as any
    const actual = [obj.id, obj.name].join(' ')
    const expected = [uid, name].join(' ')
    expect(actual).to.equal(expected)
  })

  it('generates an access JWT that includes the isuer', async () => {
    const pkg = await loadPackage()
    const { host } = getAPIInfo(pkg)
    const obj = jwt.verify(mockReq.tokens.access, secret) as any
    expect(obj.iss).to.equal(host)
  })

  it('generates an access JWT that includes the subject', async () => {
    const pkg = await loadPackage()
    const { root } = getAPIInfo(pkg)
    const subject = `${root}/users/${uid}`
    const obj = jwt.verify(mockReq.tokens.access, secret) as any
    expect(obj.sub).to.equal(subject)
  })

  it('generates an access JWT that includes the expiration', async () => {
    const now = new Date()
    const tokenExpires = getFirstVal(getEnvVar('JWT_EXPIRES'), 300) as number
    const limit = (now.getTime() / 1000) + tokenExpires + 5
    const obj = jwt.verify(mockReq.tokens.access, secret) as any
    expect(obj.exp).to.be.at.most(limit)
  })
})
