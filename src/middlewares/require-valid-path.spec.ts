import chai, { expect } from 'chai'
import { mockRequest, mockResponse } from 'mock-req-res'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'
import loadPackage, { NPMPackage } from '../utils/load-package.js'
import getAPIInfo from '../utils/get-api-info.js'
import requireValidPath from './require-valid-path.js'

chai.use(sinonChai)

describe('requireValidPath', () => {
  let pkg: NPMPackage
  let base: string
  let mockReq = mockRequest()
  let mockRes = mockResponse()
  let mockNext = sinon.spy()

  before(async () => {
    pkg = await loadPackage() as NPMPackage
    const info = getAPIInfo(pkg)
    base = info.base
  })

  beforeEach(() => {
    mockReq = mockRequest()
    mockRes = mockResponse()
    mockNext = sinon.spy()
  })

  afterEach(() => sinon.restore())

  it('returns an error if given a null string', async () => {
    mockReq.originalUrl = `${base}/pages`
    await requireValidPath(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'A null string is not a valid path.', path: '/' })
    expect(mockNext).to.have.callCount(0)
  })

  it('returns an error if given a path that begins with a reserved word', async () => {
    mockReq.originalUrl = `${base}/pages/login/and/more`
    await requireValidPath(mockReq, mockRes, mockNext)
    expect(mockRes.status).to.have.been.calledWith(400)
    expect(mockRes.send).to.have.been.calledWithMatch({ message: 'First element cannot be any of login, logout, dashboard, or connect.', path: '/login/and/more' })
    expect(mockNext).to.have.callCount(0)
  })

  it('calls next when the path is valid', async () => {
    mockReq.originalUrl = `${base}/pages/path/to/page`
    await requireValidPath(mockReq, mockRes, mockNext)
    expect(mockNext).to.have.callCount(1)
  })
})
