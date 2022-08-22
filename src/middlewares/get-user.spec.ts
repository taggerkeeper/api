import { expect } from 'chai'
import * as sinon from 'sinon'
import { mockRequest, mockResponse } from 'mock-req-res'
import signJWT from '../utils/sign-jwt.js'
import loadPackage, { NPMPackage } from '../utils/load-package.js'
import User from '../models/user/user.js'
import getUser from './get-user.js'

describe('getUser', () => {
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = (): void => {}
  const name = 'Tester'
  const uid = '0123456789abcdef12345678'
  const user = new User({ id: uid, name })
  let jwt: string

  beforeEach(async () => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = () => {}
    const pkg = await loadPackage()
    jwt = signJWT(user.getPublicObj(), uid, 30000, pkg as NPMPackage)
  })

  afterEach(() => sinon.restore())

  it('does nothing if there is no JWT', () => {
    getUser(mockReq, mockRes, mockNext)
    expect(mockReq.user).to.equal(undefined)
  })

  it('adds the user from the JWT', () => {
    mockReq.headers.authorization = `Bearer ${jwt}`
    getUser(mockReq, mockRes, mockNext)
    expect(`${mockReq.user?.id as string} ${mockReq.user?.name as string}`).to.equal(`${uid} ${name}`)
  })
})
